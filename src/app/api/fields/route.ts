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
  const { name, kaek, officialArea, polygon, leaseholderId } = body;

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
      kaek,
      officialArea: parseFloat(officialArea) || 0,
      calculatedArea,
      polygon: polygon ?? undefined,
      leaseholderId: leaseholderId || null,
    },
    include: { leaseholder: { select: { id: true, name: true } } },
  });

  return NextResponse.json(field, { status: 201 });
}
