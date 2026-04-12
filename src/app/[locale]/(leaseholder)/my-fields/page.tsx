import { requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import MyFieldsList from "@/components/leaseholder/MyFieldsList";

export default async function MyFieldsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await requireRole(locale, "LEASEHOLDER");
  const t = await getTranslations();

  const fields = await db.field.findMany({
    where: { leaseholderId: session.user.id },
    include: {
      cropHistory: { orderBy: { year: "desc" } },
    },
    orderBy: { name: "asc" },
  });

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">{t("nav.myFields")}</h1>
      <MyFieldsList fields={fields} currentYear={currentYear} />
    </div>
  );
}
