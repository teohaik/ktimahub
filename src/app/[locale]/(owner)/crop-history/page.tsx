import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import CropHistoryTable from "@/components/fields/CropHistoryTable";

export default async function CropHistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireRole(locale, "LAND_OWNER");
  const t = await getTranslations("cropHistory");

  const currentYear = new Date().getFullYear();

  const [fields, crops, leaseholders] = await Promise.all([
    db.field.findMany({
      where: { ownerId: session.user.id },
      select: { id: true, name: true, kaek: true, fieldNumber: true },
      orderBy: { name: "asc" },
    }),
    db.crop.findMany({ orderBy: { nameEl: "asc" } }),
    db.user.findMany({
      where: { roles: { has: "LEASEHOLDER" }, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const histories = await db.cropHistory.findMany({
    where: { fieldId: { in: fields.map((f) => f.id) }, year: currentYear },
    include: {
      crop: { select: { id: true, nameEl: true, nameEn: true } },
      leaseholder: { select: { id: true, name: true } },
    },
  });

  const historyByField = Object.fromEntries(histories.map((h) => [h.fieldId, h]));

  const initialRows = fields.map((f) => ({
    field: f,
    yearRecord: historyByField[f.id] ?? null,
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
      <CropHistoryTable
        initialRows={initialRows}
        crops={crops}
        leaseholders={leaseholders}
        initialYear={currentYear}
      />
    </div>
  );
}
