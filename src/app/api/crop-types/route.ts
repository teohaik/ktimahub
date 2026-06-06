import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const crops = await db.crop.findMany({ orderBy: { nameEl: "asc" } });
  return NextResponse.json(crops);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.activeRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { nameEl, nameEn } = await req.json();
  if (!nameEl?.trim() || !nameEn?.trim()) {
    return NextResponse.json({ error: "Both Greek and English names required" }, { status: 400 });
  }
  try {
    const crop = await db.crop.create({ data: { nameEl: nameEl.trim(), nameEn: nameEn.trim() } });
    return NextResponse.json(crop, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Name already exists" }, { status: 409 });
  }
}
