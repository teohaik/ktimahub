import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-helpers";
import Link from "next/link";
import ImportWizard from "@/components/e9/ImportWizard";

export default async function ImportFieldsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, "LAND_OWNER");
  const t = await getTranslations();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/fields`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <BackIcon />
          {t("common.back")}
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("e9Import.wizardTitle")}</h1>
      </div>

      <ImportWizard locale={locale} />
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}
