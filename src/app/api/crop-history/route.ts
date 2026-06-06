import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.activeRole !== "LAND_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? "");
  if (isNaN(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  const fields = await db.field.findMany({
    where: { ownerId: session.user.id },
    select: { id: true, name: true, kaek: true, fieldNumber: true },
    orderBy: { name: "asc" },
  });

  const histories = await db.cropHistory.findMany({
    where: {
      fieldId: { in: fields.map((f) => f.id) },
      year,
    },
    include: {
      crop: { select: { id: true, nameEl: true, nameEn: true } },
      leaseholder: { select: { id: true, name: true } },
    },
  });

  const historyByField = Object.fromEntries(histories.map((h) => [h.fieldId, h]));

  const result = fields.map((f) => ({
    field: f,
    yearRecord: historyByField[f.id] ?? null,
  }));

  return NextResponse.json(result);
}
