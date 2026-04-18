import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import LoginForm from "@/components/auth/LoginForm";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import Link from "next/link";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ verified?: string }>;
}) {
  const { locale } = await params;
  const { verified } = await searchParams;
  const session = await auth();

  // Already logged in — go to role-based home
  if (session?.user) {
    redirect(`/${locale}`);
  }

  const t = await getTranslations("auth");

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-gray-100">
      <div className="flex items-center justify-between p-4">
        <Link href={`/${locale}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          <span className="text-sm font-medium">KtimaHub</span>
        </Link>
        <LanguageSwitcher />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🌾</div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Ktima<span className="text-green-600">Hub</span>
            </h1>
          </div>

          <LoginForm locale={locale} verified={verified === "1"} />

          <p className="text-center text-xs text-gray-500 mt-4">
            {t("dontHaveAccount")}{" "}
            <Link href={`/${locale}/signup`} className="text-green-600 hover:underline font-medium">
              {t("signUp")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
