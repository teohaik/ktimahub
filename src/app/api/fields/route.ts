import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { calculatePolygonArea } from "@/lib/map/coords";
import type { LatLng } from "@/lib/map/types";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.activeRole !== "LAND_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fields = await db.field.findMany({
    where: { ownerId: session.user.id },
    include: { leaseholder: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(fields);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.activeRole !== "LAND_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, fieldNumber, kaek, officialArea, polygon, leaseholderId } = body;

  if (!name || !kaek) {
    return NextResponse.json({ error: "name and kaek are required" }, { status: 400 });
  }

  const calculatedArea =
    polygon && polygon.length >= 3
      ? calculatePolygonArea(polygon as LatLng[])
      : null;

  const field = await db.field.create({
    data: {
      name,
      fieldNumber: fieldNumber || null,
      kaek,
      officialArea: parseFloat(officialArea) || 0,
      calculatedArea,
      polygon: polygon ?? undefined,
      ownerId: session.user.id,
      leaseholderId: leaseholderId || null,
    },
    include: { leaseholder: { select: { id: true, name: true } } },
  });

  return NextResponse.json(field, { status: 201 });
}
