import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import LoginForm from "@/components/auth/LoginForm";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  // Already logged in — go to role-based home
  if (session?.user) {
    redirect(`/${locale}`);
  }

  const t = await getTranslations("common");

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-gray-100">
      {/* Top bar with language switcher */}
      <div className="flex justify-end p-4">
        <LanguageSwitcher />
      </div>

      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {/* Logo & title */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🌾</div>
            <h1 className="text-2xl font-bold text-gray-900">{t("appName")}</h1>
          </div>

          <LoginForm locale={locale} />
        </div>
      </div>
    </div>
  );
}
