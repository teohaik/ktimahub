import { requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import CropsManager from "@/components/admin/CropsManager";

export default async function CropsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, "SUPER_ADMIN");
  const t = await getTranslations();

  const crops = await db.crop.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">{t("crops.title")}</h1>
      <CropsManager initialCrops={crops} />
    </div>
  );
}
