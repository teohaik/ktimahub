import { NextResponse } from "next/server";
import { auth } from "@/auth";
import Anthropic from "@anthropic-ai/sdk";

export interface E9ParsedField {
  kaek: string;
  name: string;
  municipality: string;
  district: string;
  prefecture: string;
  officialArea: number;
  cultivationType: "ANNUAL" | "PERENNIAL" | "OLIVE" | "OTHER_TREES" | "PASTURE" | "FOREST" | "OTHER";
  ownershipPercentage: number;
  irrigated: boolean;
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  // Dynamic import keeps pdfjs-dist out of the Next.js bundle (serverExternalPackages)
  const { PDFParse } = await import("pdf-parse");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parser = new PDFParse({ data: new Uint8Array(buffer) }) as any;
  const result = await parser.getText();
  return result.text as string;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.activeRole !== "LAND_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
  }

  let text: string;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    text = await extractPdfText(buffer);
  } catch (err) {
    console.error("[e9/parse] PDF extraction failed:", err);
    return NextResponse.json({ error: "Failed to read PDF" }, { status: 422 });
  }

  let fields: E9ParsedField[];
  try {
    const client = new Anthropic();
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: `You are a data extractor for Greek E9 tax property declaration PDFs.
Extract all rows from the table titled "ΠΙΝΑΚΑΣ 2: ΣΤΟΙΧΕΙΑ ΓΗΠΕΔΩΝ" (Table 2: Land/Field data).

Each row represents one agricultural land parcel. The area columns represent:
Column index 1 = ΜΟΝΟΕΤΗΣ ΚΑΛΛΙΕΡΓΕΙΑ (annual crops) → cultivationType: "ANNUAL"
Column index 2 = ΠΟΛΥΕΤΗΣ ΚΑΛΛΙΕΡΓΕΙΑ (perennial crops) → cultivationType: "PERENNIAL"
Column index 3 = ΕΛΙΕΣ (olive trees) → cultivationType: "OLIVE"
Column index 4 = ΛΟΙΠΕΣ ΔΕΝΔΡΟΚΑΛΛΙΕΡΓΕΙΕΣ (other tree crops) → cultivationType: "OTHER_TREES"
Column index 5 = ΒΟΣΚΟΤΟΠΟΣ/ΧΕΡΣΕΣ (pasture/uncultivated) → cultivationType: "PASTURE"
Column index 6 = ΔΑΣΙΚΗ ΕΚΤΑΣΗ (forest) → cultivationType: "FOREST"
Column index 7+ = other → cultivationType: "OTHER"

The number appearing immediately before the area value in a row is the column index.
Area values use Greek number format with dots as thousands separators and commas as decimals (e.g. "4.638,00" = 4638.00 m²).
Ownership percentage appears as e.g. "37,5" or "100" (convert to float, e.g. 37.5, 100.0).
Irrigated = "ΝΑΙ" → true, "ΟΧΙ" → false.

KAEK is the long property code like "007650 390300 98097 201011" or "012826 390310 50865 505002".
Name/location (ΘΕΣΗ) is the place name and number like "ΚΑΖΑΝΙΑ 316" or "ΕΦΟΡΙΑ 88".
Municipality (ΔΗΜΟΣ) and district (ΔΗΜΟΤΙΚΟ ΔΙΑΜΕΡΙΣΜΑ) and prefecture (ΝΟΜΟΣ) are location fields.

Return ONLY a valid JSON array of objects with these exact fields:
{
  "kaek": string,
  "name": string,
  "municipality": string,
  "district": string,
  "prefecture": string,
  "officialArea": number,
  "cultivationType": "ANNUAL"|"PERENNIAL"|"OLIVE"|"OTHER_TREES"|"PASTURE"|"FOREST"|"OTHER",
  "ownershipPercentage": number,
  "irrigated": boolean
}

Return an empty array [] if no ΠΙΝΑΚΑΣ 2 rows are found. Output only raw JSON, no markdown.`,
      messages: [{ role: "user", content: text }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "[]";
    fields = JSON.parse(raw);
    if (!Array.isArray(fields)) throw new Error("Not an array");
  } catch (err) {
    console.error("[e9/parse] Claude extraction failed:", err);
    return NextResponse.json({ error: "Failed to parse PDF content" }, { status: 422 });
  }

  return NextResponse.json({ fields });
}
