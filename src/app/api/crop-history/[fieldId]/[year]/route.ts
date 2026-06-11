import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ fieldId: string; year: string }> };

export async function PUT(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.activeRole !== "LAND_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fieldId, year: yearStr } = await params;
  const year = parseInt(yearStr);
  if (isNaN(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  // Ownership check
  const field = await db.field.findUnique({ where: { id: fieldId, ownerId: session.user.id } });
  if (!field) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { cropId, leaseholderId } = await req.json();

  const record = await db.cropHistory.upsert({
    where: { fieldId_year: { fieldId, year } },
    create: { fieldId, year, cropId: cropId ?? null, leaseholderId: leaseholderId ?? null },
    update: { cropId: cropId ?? null, leaseholderId: leaseholderId ?? null },
    include: {
      crop: { select: { id: true, nameEl: true, nameEn: true } },
      leaseholder: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(record);
}
