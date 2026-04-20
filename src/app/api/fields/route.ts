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

  if (!name || typeof name !== "string" || name.trim().length === 0 || name.length > 255) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }
  if (!kaek || typeof kaek !== "string" || kaek.trim().length === 0 || kaek.length > 50) {
    return NextResponse.json({ error: "Invalid kaek" }, { status: 400 });
  }
  if (officialArea !== undefined && officialArea !== null) {
    const area = parseFloat(officialArea);
    if (isNaN(area) || area < 0) {
      return NextResponse.json({ error: "Invalid officialArea" }, { status: 400 });
    }
  }
  if (polygon !== undefined && polygon !== null) {
    if (
      !Array.isArray(polygon) ||
      polygon.length < 3 ||
      !polygon.every(
        (p: unknown) =>
          typeof p === "object" &&
          p !== null &&
          typeof (p as Record<string, unknown>).lat === "number" &&
          typeof (p as Record<string, unknown>).lng === "number"
      )
    ) {
      return NextResponse.json({ error: "Invalid polygon" }, { status: 400 });
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

  const field = await db.field.create({
    data: {
      name: name.trim(),
      fieldNumber: fieldNumber || null,
      kaek: kaek.trim(),
      officialArea: officialArea != null ? parseFloat(officialArea) : 0,
      calculatedArea,
      polygon: polygon ?? undefined,
      ownerId: session.user.id,
      leaseholderId: leaseholderId || null,
    },
    include: { leaseholder: { select: { id: true, name: true } } },
  });

  return NextResponse.json(field, { status: 201 });
}
