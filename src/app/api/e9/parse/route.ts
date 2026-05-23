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
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: pdfBase64,
              },
            },
            {
              type: "text",
              text: `Extract all rows from the table "ΠΙΝΑΚΑΣ 2: ΣΤΟΙΧΕΙΑ ΓΗΠΕΔΩΝ" in this Greek E9 tax declaration PDF.

Each row is one agricultural parcel. Map the column index before the area value to cultivationType:
1=ANNUAL, 2=PERENNIAL, 3=OLIVE, 4=OTHER_TREES, 5=PASTURE, 6=FOREST, 7+=OTHER

Rules:
- Area: Greek format "4.638,00" → 4638.0
- Ownership: "37,5" → 37.5
- Irrigated: "ΝΑΙ" → true, "ΟΧΙ" → false
- KAEK: full code e.g. "007650 390300 98097 201011"
- name: location/place name e.g. "ΚΑΖΑΝΙΑ 316"

Output the JSON array continuation (the opening bracket has already been written):`,
            },
          ],
        },
        {
          role: "assistant",
          content: "[",
        },
      ],
    });

    const completion = message.content[0].type === "text" ? message.content[0].text.trim() : "]";
    // Prepend the prefilled "[" and parse
    const cleaned = ("[" + completion).replace(/\n?```$/i, "").trim();
    fields = JSON.parse(cleaned);
    if (!Array.isArray(fields)) throw new Error("Not an array");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[e9/parse] Claude extraction failed:", msg);
    return NextResponse.json({ error: "Failed to parse PDF content", detail: msg }, { status: 422 });
  }

  return NextResponse.json({ fields });
}
