import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { checkRateLimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ token: string }> };

export async function POST(req: Request, { params }: Params) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const { allowed } = await checkRateLimit("invite", ip);
  if (!allowed) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  const { token } = await params;
  const { name, password } = await req.json();

  if (!name || !password) {
    return NextResponse.json(
      { error: "name and password are required" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "password_too_short" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);

  try {
    const user = await db.$transaction(async (tx) => {
      // Fetch and invalidate atomically — prevents replay in race conditions
      const invite = await tx.invite.findUnique({ where: { token } });

      if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
        throw new Error("invalid_or_expired");
      }
      if (!invite.userId) {
        throw new Error("invalid_or_expired");
      }

      await tx.invite.update({ where: { token }, data: { usedAt: new Date() } });

      return tx.user.update({
        where: { id: invite.userId },
        data: { name, password: hashed, status: "ACTIVE" },
        select: { id: true, email: true, name: true, roles: true },
      });
    });

    return NextResponse.json(user, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "invalid_or_expired") {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 410 }
      );
    }
    throw err;
  }
}
