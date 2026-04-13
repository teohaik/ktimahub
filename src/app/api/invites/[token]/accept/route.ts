import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

type Params = { params: Promise<{ token: string }> };

export async function POST(req: Request, { params }: Params) {
  const { token } = await params;
  const { name, password } = await req.json();

  if (!name || !password) {
    return NextResponse.json(
      { error: "name and password are required" },
      { status: 400 }
    );
  }

  const invite = await db.invite.findUnique({ where: { token } });

  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Invalid or expired invitation" },
      { status: 410 }
    );
  }

  const hashed = await bcrypt.hash(password, 12);

  // Upsert: if a user with this email already exists (e.g. created via Google
  // before accepting the invite), merge roles; otherwise create fresh.
  const existing = await db.user.findUnique({ where: { email: invite.email } });

  let user;
  if (existing) {
    const merged = Array.from(new Set([...existing.roles, ...invite.roles]));
    user = await db.user.update({
      where: { id: existing.id },
      data: { name, password: hashed, roles: merged },
      select: { id: true, email: true, name: true, roles: true },
    });
  } else {
    user = await db.user.create({
      data: {
        name,
        email: invite.email,
        password: hashed,
        roles: invite.roles,
      },
      select: { id: true, email: true, name: true, roles: true },
    });
  }

  await db.invite.update({
    where: { token },
    data: { usedAt: new Date() },
  });

  return NextResponse.json(user, { status: 201 });
}
