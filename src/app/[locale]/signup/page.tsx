import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import SignupForm from "@/components/auth/SignupForm";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import Link from "next/link";

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

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
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {t("signupTitle")}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{t("signupSubtitle")}</p>
          </div>

          <SignupForm locale={locale} />
        </div>
      </div>
    </div>
  );
}
