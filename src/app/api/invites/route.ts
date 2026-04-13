import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sendInviteEmail } from "@/lib/email";
import { randomUUID } from "crypto";
import type { Role } from "@/generated/prisma/client";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.activeRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { email, roles, locale } = body as {
    email: string;
    roles: Role[];
    locale?: string;
  };

  if (!email || !roles?.length) {
    return NextResponse.json(
      { error: "email and roles are required" },
      { status: 400 }
    );
  }

  // Check if a user with this email already exists
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "A user with this email already exists" },
      { status: 409 }
    );
  }

  // Cancel any existing unused invites for this email
  await db.invite.updateMany({
    where: { email, usedAt: null },
    data: { usedAt: new Date() }, // mark as used / superseded
  });

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invite = await db.invite.create({
    data: { email, roles, token, expiresAt },
  });

  await sendInviteEmail({
    to: email,
    token,
    roles,
    locale: locale ?? "el",
  });

  return NextResponse.json(invite, { status: 201 });
}
