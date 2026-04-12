import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { FieldsTablePdf } from "@/lib/pdf/FieldsTablePdf";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "LAND_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fields = await db.field.findMany({
    include: { leaseholder: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  const buffer = await renderToBuffer(FieldsTablePdf({ fields }));
  // Cast Buffer → Uint8Array so NextResponse accepts it
  const body = new Uint8Array(buffer);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="fields-report.pdf"`,
    },
  });
}
