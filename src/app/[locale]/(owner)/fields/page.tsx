import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import FieldsTable from "@/components/fields/FieldsTable";
import FullReportButton from "@/components/fields/FullReportButton";
import Link from "next/link";
import type { LatLng } from "@/lib/map/types";

export default async function FieldsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireRole(locale, "LAND_OWNER");
  const t = await getTranslations();

  const fields = await db.field.findMany({
    where: { ownerId: session.user.id },
    include: {
      leaseholder: { select: { id: true, name: true } },
      crop: { select: { id: true, nameEl: true, nameEn: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{t("fields.title")}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {/* PDF table report */}
          <a
            href="/api/reports/table"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <PrintIcon />
            {t("fields.reportTable")}
          </a>
          <FullReportButton
            fields={fields.map((f) => ({
              id: f.id,
              name: f.name,
              fieldNumber: f.fieldNumber ?? null,
              kaek: f.kaek,
              officialArea: f.officialArea,
              calculatedArea: f.calculatedArea,
              leaseholderName: f.leaseholder?.name ?? null,
              polygon: (f.polygon as LatLng[] | null) ?? null,
            }))}
          />
          <Link
            href={`/${locale}/fields/import`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ImportIcon />
            {t("e9Import.importE9")}
          </Link>
          <Link
            href={`/${locale}/fields/new`}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            <PlusIcon />
            {t("fields.addField")}
          </Link>
        </div>
      </div>

      <FieldsTable fields={fields.map((f) => ({ ...f, fieldNumber: f.fieldNumber ?? null }))} locale={locale} />
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ImportIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}
