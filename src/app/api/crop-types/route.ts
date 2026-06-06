import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const crops = await db.crop.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(crops);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.activeRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { name } = await req.json();
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }
  try {
    const crop = await db.crop.create({ data: { name: name.trim() } });
    return NextResponse.json(crop, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Name already exists" }, { status: 409 });
  }
}
