import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ token: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { token } = await params;

  const invite = await db.invite.findUnique({ where: { token } });

  if (!invite) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (invite.usedAt) {
    return NextResponse.json({ error: "already_used" }, { status: 410 });
  }
  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "expired" }, { status: 410 });
  }

  return NextResponse.json({
    email: invite.email,
    roles: invite.roles,
  });
}
