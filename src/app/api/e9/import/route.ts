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

  const created = await db.$transaction(
    fields.map((f) =>
      db.field.create({
        data: {
          name: f.name.trim().slice(0, 255) || "Αγροτεμάχιο",
          kaek: f.kaek.trim().slice(0, 50),
          officialArea: f.officialArea,
          cultivationType: f.cultivationType,
          ownerId: session.user.id,
        },
      })
    )
  );

  return NextResponse.json({ count: created.length }, { status: 201 });
}
