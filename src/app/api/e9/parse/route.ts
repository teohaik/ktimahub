import { NextResponse } from "next/server";
import { auth } from "@/auth";
import Anthropic from "@anthropic-ai/sdk";

export interface E9ParsedField {
  atak: string;
  kaek: string;
  name: string;
  fieldNumber: string;
  municipality: string;
  district: string;
  prefecture: string;
  officialArea: number;
  cultivationType: "ANNUAL" | "PERENNIAL" | "OLIVE" | "OTHER_TREES" | "PASTURE" | "FOREST" | "OTHER";
  ownershipPercentage: number;
  irrigated: boolean;
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

  const buffer = Buffer.from(await file.arrayBuffer());
  const pdfBase64 = buffer.toString("base64");

  let fields: E9ParsedField[];
  try {
    const client = new Anthropic();
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      tools: [
        {
          name: "import_fields",
          description: "Import extracted agricultural parcels from ΠΙΝΑΚΑΣ 2 of an E9 declaration",
          input_schema: {
            type: "object" as const,
            properties: {
              fields: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    atak: { type: "string" },
                    kaek: { type: "string" },
                    name: { type: "string" },
                    fieldNumber: { type: "string" },
                    municipality: { type: "string" },
                    district: { type: "string" },
                    prefecture: { type: "string" },
                    officialArea: { type: "number" },
                    cultivationType: { type: "string", enum: ["ANNUAL","PERENNIAL","OLIVE","OTHER_TREES","PASTURE","FOREST","OTHER"] },
                    ownershipPercentage: { type: "number" },
                    irrigated: { type: "boolean" },
                  },
                  required: ["atak","kaek","name","fieldNumber","municipality","district","prefecture","officialArea","cultivationType","ownershipPercentage","irrigated"],
                },
              },
            },
            required: ["fields"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "import_fields" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: pdfBase64 },
            },
            {
              type: "text",
              text: `This is a Greek E9 tax property declaration (Βεβαίωση Δηλωθείσας Περιουσιακής Κατάστασης).

Find the table called "ΠΙΝΑΚΑΣ 2: ΣΤΟΙΧΕΙΑ ΓΗΠΕΔΩΝ" (it may span multiple pages). Extract EVERY row from this table and call import_fields.

Each row in ΠΙΝΑΚΑΣ 2 represents one agricultural land parcel and contains:

CRITICAL — two separate code columns appear side-by-side, both wrapping across 2 PDF lines:
  Column 1 header "Α.Τ.Α.Κ." → put in "atak" field.
    ATAK has exactly 2 numeric parts, one per wrapped line.
    Example: line 1 = "008546", line 2 = "89850" → atak = "008546 89850"
  Column 2 header "Κ.Α.Ε.Κ." → put in "kaek" field. NEVER mix ATAK digits into kaek.
    KAEK has exactly 4 numeric parts, two per wrapped line.
    Example: line 1 = "007650 390311", line 2 = "98089 204067" → kaek = "007650 390311 98089 204067"
    If a parcel has no KAEK yet, kaek = "".
- ΝΟΜΟΣ: prefecture e.g. "ΠΙΕΡΙΑΣ"
- ΔΗΜΟΣ: municipality e.g. "ΜΕΘΩΝΗΣ"
- ΔΗΜΟΤΙΚΟ ΔΙΑΜΕΡΙΣΜΑ: district e.g. "ΜΕΘΩΝΗΣ"
- ΘΕΣΗ/ΟΔΟΣ: location name e.g. "ΚΑΖΑΝΙΑ 316" or "ΕΦΟΡΙΑ 88". Split into two parts: the text portion goes into "name" (e.g. "ΚΑΖΑΝΙΑ", "ΕΦΟΡΙΑ") and the trailing number goes into "fieldNumber" (e.g. "316", "88"). If there is no trailing number, fieldNumber is "".
- Area in m²: a number like "4.638,00" (dot=thousands, comma=decimal) → 4638.0
- A column index (1-8) indicating the type of land use:
  1=ΜΟΝΟΕΤΗΣ ΚΑΛΛΙΕΡΓΕΙΑ → "ANNUAL"
  2=ΠΟΛΥΕΤΗΣ ΚΑΛΛΙΕΡΓΕΙΑ → "PERENNIAL"
  3=ΕΛΙΕΣ → "OLIVE"
  4=ΛΟΙΠΕΣ ΔΕΝΔΡΟΚΑΛΛΙΕΡΓΕΙΕΣ → "OTHER_TREES"
  5=ΒΟΣΚΟΤΟΠΟΣ → "PASTURE"
  6=ΔΑΣΙΚΗ ΕΚΤΑΣΗ → "FOREST"
  7 or 8 → "OTHER"
- ΠΟΣΟΣΤΟ ΣΥΝΙΔΙΟΚΤΗΣΙΑΣ: ownership % e.g. "37,5" → 37.5 or "100" → 100.0
- Η ΕΔΑΦΙΚΗ ΕΚΤΑΣΗ ΕΙΝΑΙ ΑΡΔΕΥΟΜΕΝΗ: irrigated "ΝΑΙ"=true / "ΟΧΙ"=false

Example row: atak="008546 89850", kaek="007650 390300 98097 201011", location "ΚΑΖΑΝΙΑ 316" → name="ΚΑΖΑΝΙΑ" fieldNumber="316", ΠΙΕΡΙΑΣ, ΜΕΘΩΝΗΣ, area=4638.0, column 3→OLIVE, ownership=100.0, irrigated=false.

Extract ALL rows from ΠΙΝΑΚΑΣ 2 (there may be 10–50 rows across multiple pages). Call import_fields even if only some fields are partially readable.`,
            },
          ],
        },
      ],
    });

    const toolUse = message.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") throw new Error("No tool_use block in response");
    const input = toolUse.input as { fields: E9ParsedField[] };
    fields = input.fields ?? [];
    console.log(`[e9/parse] stop_reason=${message.stop_reason} fields_found=${fields.length}`);
    if (!Array.isArray(fields)) throw new Error("Not an array");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[e9/parse] Claude extraction failed:", msg);
    return NextResponse.json({ error: "Failed to parse PDF content", detail: msg }, { status: 422 });
  }

  return NextResponse.json({ fields });
}
