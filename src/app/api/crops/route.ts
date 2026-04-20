import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { CropType } from "@/generated/prisma/client";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { fieldId, year, cropType } = body;

  if (!fieldId || !year || !cropType) {
    return NextResponse.json({ error: "fieldId, year, cropType required" }, { status: 400 });
  }

  const field = await db.field.findUnique({ where: { id: fieldId } });
  if (!field) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const role = session.user.activeRole;
  if (role === "LEASEHOLDER" && field.leaseholderId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (role === "LAND_OWNER" && field.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const crop = await db.cropHistory.upsert({
    where: { fieldId_year: { fieldId, year: parseInt(year) } },
    update: { cropType: cropType as CropType },
    create: { fieldId, year: parseInt(year), cropType: cropType as CropType },
  });

  return NextResponse.json(crop);
}
