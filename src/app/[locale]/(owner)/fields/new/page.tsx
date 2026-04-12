import { requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import FieldForm from "@/components/fields/FieldForm";
import Link from "next/link";

export default async function NewFieldPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, "LAND_OWNER");
  const t = await getTranslations();

  const leaseholders = await db.user.findMany({
    where: { roles: { has: "LEASEHOLDER" } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href={`/${locale}/fields`} className="hover:text-gray-800">
          {t("fields.title")}
        </Link>
        <span>/</span>
        <span className="text-gray-900">{t("fields.addField")}</span>
      </div>
      <FieldForm leaseholders={leaseholders} />
    </div>
  );
}
