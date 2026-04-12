import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { calculatePolygonArea } from "@/lib/map/coords";
import type { LatLng } from "@/lib/map/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.activeRole !== "LAND_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const field = await db.field.findUnique({
    where: { id },
    include: {
      leaseholder: { select: { id: true, name: true } },
      cropHistory: { orderBy: { year: "desc" } },
    },
  });

  if (!field) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(field);
}

export async function PUT(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.activeRole !== "LAND_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, kaek, officialArea, polygon, leaseholderId } = body;

  const calculatedArea =
    polygon && polygon.length >= 3
      ? calculatePolygonArea(polygon as LatLng[])
      : null;

  const field = await db.field.update({
    where: { id },
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

  return NextResponse.json(field);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.activeRole !== "LAND_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await db.field.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
