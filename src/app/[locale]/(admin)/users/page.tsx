import { requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import UsersManager from "@/components/admin/UsersManager";

export default async function UsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, "SUPER_ADMIN");
  const t = await getTranslations();

  const users = await db.user.findMany({
    select: { id: true, name: true, email: true, roles: true, createdAt: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">{t("users.title")}</h1>
      <UsersManager users={users} />
    </div>
  );
}
