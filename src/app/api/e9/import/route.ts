import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { E9ParsedField } from "../parse/route";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.activeRole !== "LAND_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { fields } = body as { fields: E9ParsedField[] };

  if (!Array.isArray(fields) || fields.length === 0) {
    return NextResponse.json({ error: "No fields provided" }, { status: 400 });
  }

  if (fields.length > 200) {
    return NextResponse.json({ error: "Too many fields (max 200)" }, { status: 400 });
  }

  const incomingAtaks = fields
    .map((f) => f.atak?.replace(/\s+/g, "").slice(0, 50))
    .filter((a): a is string => !!a);

  const existing = incomingAtaks.length > 0
    ? await db.field.findMany({
        where: { ownerId: session.user.id, atak: { in: incomingAtaks } },
        select: { atak: true },
      })
    : [];

  const existingAtaks = new Set(existing.map((f) => f.atak));

  const toCreate = fields.filter((f) => {
    const atak = f.atak?.replace(/\s+/g, "").slice(0, 50);
    return !atak || !existingAtaks.has(atak);
  });

  const created = await db.$transaction(
    toCreate.map((f) =>
      db.field.create({
        data: {
          name: f.name.trim().slice(0, 255) || "Αγροτεμάχιο",
          fieldNumber: f.fieldNumber?.trim().slice(0, 50) || null,
          atak: f.atak ? f.atak.replace(/\s+/g, "").slice(0, 50) || null : null,
          kaek: f.kaek.replace(/\s+/g, "").slice(0, 50),
          officialArea: f.officialArea,
          cultivationType: f.cultivationType,
          ownershipPercentage: f.ownershipPercentage,
          ownerId: session.user.id,
        },
      })
    )
  );

  const skipped = fields.length - toCreate.length;
  return NextResponse.json({ count: created.length, skipped }, { status: 201 });
}
