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

  if (!invite.userId) {
    return NextResponse.json(
      { error: "Invalid invitation" },
      { status: 410 }
    );
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await db.user.update({
    where: { id: invite.userId },
    data: { name, password: hashed, status: "ACTIVE" },
    select: { id: true, email: true, name: true, roles: true },
  });

  await db.invite.update({
    where: { token },
    data: { usedAt: new Date() },
  });

  return NextResponse.json(user, { status: 200 });
}
