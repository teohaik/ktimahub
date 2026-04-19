import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const { allowed } = await checkRateLimit("signup", ip);
  if (!allowed) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  const { name, email, password, locale = "el", website } = await req.json();

  // Honeypot: real users never fill this field
  if (website) {
    return NextResponse.json({ ok: true, requiresVerification: true });
  }

  if (!name || !email || !password) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "password_too_short" }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email } });

  if (existing?.status === "ACTIVE") {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);

  if (existing?.status === "INVITED") {
    // Admin pre-verified this email — activate directly, no email verification needed
    await db.user.update({
      where: { id: existing.id },
      data: { name, password: hashed, status: "ACTIVE" },
    });
    return NextResponse.json({ ok: true, requiresVerification: false }, { status: 201 });
  }

  if (existing?.status === "PENDING_VERIFICATION") {
    // Allow re-registration (e.g. resend link) — update credentials and resend
    await db.user.update({
      where: { id: existing.id },
      data: { name, password: hashed },
    });
    await db.verificationToken.deleteMany({ where: { identifier: email } });
  } else {
    await db.user.create({
      data: {
        name,
        email,
        password: hashed,
        roles: ["LAND_OWNER"],
        status: "PENDING_VERIFICATION",
      },
    });
  }

  const token = randomBytes(32).toString("hex");
  await db.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await sendVerificationEmail({ to: email, token, locale });

  return NextResponse.json({ ok: true, requiresVerification: true }, { status: 201 });
}
