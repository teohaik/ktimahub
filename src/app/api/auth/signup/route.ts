import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing?.status === "ACTIVE") {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);

  if (existing?.status === "INVITED") {
    // Complete the invited user's registration
    await db.user.update({
      where: { id: existing.id },
      data: { name, password: hashed, status: "ACTIVE" },
    });
  } else {
    await db.user.create({
      data: { name, email, password: hashed, roles: ["LAND_OWNER"], status: "ACTIVE" },
    });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
