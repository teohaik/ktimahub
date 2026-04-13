import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { renderToBuffer, Font } from "@react-pdf/renderer";
import { FieldsTablePdf } from "@/lib/pdf/FieldsTablePdf";
import path from "path";

// Register a Unicode font that covers Greek before any PDF is rendered.
// Font.register is idempotent — safe to call on every cold start.
Font.register({
  family: "NotoSans",
  fonts: [
    { src: path.join(process.cwd(), "public", "fonts", "NotoSans-Regular.ttf") },
    {
      src: path.join(process.cwd(), "public", "fonts", "NotoSans-Bold.ttf"),
      fontWeight: "bold",
    },
  ],
});

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.activeRole !== "LAND_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fields = await db.field.findMany({
    where: { ownerId: session.user.id },
    include: { leaseholder: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  const buffer = await renderToBuffer(FieldsTablePdf({ fields }));
  const body = new Uint8Array(buffer);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="fields-report.pdf"`,
    },
  });
}
