"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { routing } from "@/i18n/routing";

export default function LanguageSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale() {
    const next = routing.locales.find((l) => l !== locale) ?? locale;
    // Replace current locale prefix with the new one
    const newPath = pathname.replace(`/${locale}`, `/${next}`);
    router.replace(newPath);
  }

  return (
    <button
      onClick={switchLocale}
      className="text-sm font-medium px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100 transition-colors"
    >
      {t("switchLanguage")}
    </button>
  );
}
