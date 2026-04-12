import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import RoleSelector from "@/components/auth/RoleSelector";
import type { Role } from "@/generated/prisma/client";

export default async function SelectRolePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const { roles, activeRole } = session.user;

  // Single-role users should never land here
  if (roles.length <= 1) {
    redirect(`/${locale}`);
  }

  // Already selected — go straight to the right view
  if (activeRole) {
    redirect(`/${locale}`);
  }

  const t = await getTranslations("roleSelection");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-3">🌾</div>
          <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
        </div>
        <RoleSelector roles={roles as Role[]} locale={locale} />
      </div>
    </div>
  );
}
