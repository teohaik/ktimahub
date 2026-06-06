import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.activeRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const { nameEl, nameEn } = await req.json();
  if (!nameEl?.trim() || !nameEn?.trim()) {
    return NextResponse.json({ error: "Both Greek and English names required" }, { status: 400 });
  }
  try {
    const crop = await db.crop.update({ where: { id }, data: { nameEl: nameEl.trim(), nameEn: nameEn.trim() } });
    return NextResponse.json(crop);
  } catch {
    return NextResponse.json({ error: "Name already exists" }, { status: 409 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.activeRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await db.crop.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
