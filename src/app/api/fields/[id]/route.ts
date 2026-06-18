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
    where: { id, ownerId: session.user.id },
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
  const { name, fieldNumber, kaek, atak, officialArea, ownershipPercentage, polygon, leaseholderId, cropId } = body;

  if (atak != null && (typeof atak !== "string" || atak.length > 50)) {
    return NextResponse.json({ error: "Invalid atak" }, { status: 400 });
  }

  let parsedOwnership: number | null = null;
  if (ownershipPercentage != null) {
    parsedOwnership = parseFloat(ownershipPercentage);
    if (isNaN(parsedOwnership) || parsedOwnership < 0 || parsedOwnership > 100) {
      return NextResponse.json({ error: "Invalid ownershipPercentage" }, { status: 400 });
    }
  }

  let parsedOfficialArea = 0;
  if (officialArea !== undefined && officialArea !== null) {
    parsedOfficialArea = parseFloat(officialArea);
    if (isNaN(parsedOfficialArea) || parsedOfficialArea < 0) {
      return NextResponse.json({ error: "Invalid officialArea" }, { status: 400 });
    }
  }

  if (leaseholderId) {
    const leaseholder = await db.user.findUnique({ where: { id: leaseholderId } });
    if (!leaseholder || !leaseholder.roles.includes("LEASEHOLDER")) {
      return NextResponse.json({ error: "Invalid leaseholder" }, { status: 400 });
    }
  }

  const calculatedArea =
    polygon && polygon.length >= 3
      ? calculatePolygonArea(polygon as LatLng[])
      : null;

  const field = await db.field.update({
    where: { id, ownerId: session.user.id },
    data: {
      name,
      fieldNumber: fieldNumber || null,
      kaek,
      atak: atak?.trim() || null,
      officialArea: parsedOfficialArea,
      ownershipPercentage: parsedOwnership,
      calculatedArea,
      polygon: polygon ?? undefined,
      leaseholderId: leaseholderId || null,
      cropId: cropId || null,
    },
    include: {
      leaseholder: { select: { id: true, name: true } },
      crop: { select: { id: true, nameEl: true, nameEn: true } },
    },
  });

  return NextResponse.json(field);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.activeRole !== "LAND_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await db.field.delete({ where: { id, ownerId: session.user.id } });
  return NextResponse.json({ ok: true });
}
