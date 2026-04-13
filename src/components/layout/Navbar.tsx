"use client";

import { useTranslations, useLocale } from "next-intl";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import type { Role } from "@/generated/prisma/client";

interface NavbarProps {
  role: Role;
  userName?: string | null;
}

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Διαχειριστής",
  LAND_OWNER: "Ιδιοκτήτης",
  LEASEHOLDER: "Ενοικιαστής",
};

export default function Navbar({ role, userName }: NavbarProps) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const { data: session, update } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const roles = (session?.user?.roles ?? []) as Role[];
  const hasMultipleRoles = roles.length > 1;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSwitchRole() {
    setMenuOpen(false);
    await update({ activeRole: null });
    window.location.href = `/${locale}/select-role`;
  }

  function handleLogout() {
    setMenuOpen(false);
    signOut({ callbackUrl: `/${locale}/login` });
  }

  const navLinks: Record<Role, { href: string; label: string }[]> = {
    SUPER_ADMIN: [{ href: `/${locale}/users`, label: t("nav.users") }],
    LAND_OWNER: [
      { href: `/${locale}/fields`, label: t("nav.fields") },
      { href: `/${locale}/map`, label: t("nav.map") },
    ],
    LEASEHOLDER: [{ href: `/${locale}/my-fields`, label: t("nav.myFields") }],
  };

  const links = navLinks[role] ?? [];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="font-bold text-gray-900 text-base tracking-tight shrink-0 flex items-center gap-2"
          >
            <span className="text-xl">🌾</span>
            <span>Ktima<span className="text-green-600">Hub</span></span>
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

            {/* User menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-700 font-semibold text-xs shrink-0">
                  {(userName ?? "?")[0].toUpperCase()}
                </span>
                <span className="hidden sm:block">{userName ?? t("auth.login")}</span>
                <ChevronIcon open={menuOpen} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-medium text-gray-900 text-sm">{userName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{ROLE_LABELS[role]}</p>
                  </div>

                  {/* Switch role */}
                  {hasMultipleRoles && (
                    <button
                      onClick={handleSwitchRole}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                    >
                      <span className="text-base">⇄</span>
                      {t("auth.switchRole")}
                    </button>
                  )}

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5"
                  >
                    <span className="text-base">→</span>
                    {t("auth.logout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile nav links */}
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

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform text-gray-400 ${open ? "rotate-180" : ""}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
