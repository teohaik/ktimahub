"use client";

import { useTranslations, useLocale } from "next-intl";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import type { Role } from "@/generated/prisma/client";

interface NavbarProps {
  role: Role;
  userName?: string | null;
}

export default function Navbar({ role, userName }: NavbarProps) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const { data: session, update } = useSession();

  const roles = (session?.user?.roles ?? []) as Role[];
  const hasMultipleRoles = roles.length > 1;

  async function handleSwitchRole() {
    await update({ activeRole: null });
    window.location.href = `/${locale}/select-role`;
  }

  const navLinks: Record<Role, { href: string; label: string }[]> = {
    SUPER_ADMIN: [{ href: `/${locale}/users`, label: t("nav.users") }],
    LAND_OWNER: [
      { href: `/${locale}/fields`, label: t("nav.fields") },
      { href: `/${locale}/map`, label: t("nav.map") },
    ],
    LEASEHOLDER: [
      { href: `/${locale}/my-fields`, label: t("nav.myFields") },
    ],
  };

  const links = navLinks[role] ?? [];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo / App name */}
          <Link
            href={`/${locale}`}
            className="font-semibold text-green-700 text-base tracking-tight"
          >
            🌾 {t("common.appName")}
          </Link>

          {/* Nav links */}
          <div className="hidden sm:flex items-center gap-1">
            {links.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? "bg-green-50 text-green-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {userName && (
              <span className="hidden sm:block text-sm text-gray-500 truncate max-w-[120px]">
                {userName}
              </span>
            )}
            {hasMultipleRoles && (
              <button
                onClick={handleSwitchRole}
                className="text-sm font-medium text-gray-600 hover:text-green-700 transition-colors"
                title={t("auth.switchRole")}
              >
                <span className="hidden sm:inline">{t("auth.switchRole")}</span>
                <span className="sm:hidden">⇄</span>
              </button>
            )}
            <button
              onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
              className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
            >
              {t("auth.logout")}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="sm:hidden flex gap-1 pb-2 overflow-x-auto">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? "bg-green-50 text-green-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
