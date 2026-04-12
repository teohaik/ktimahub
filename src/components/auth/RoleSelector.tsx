"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import type { Role } from "@/generated/prisma/client";

const ROLE_ICONS: Record<Role, string> = {
  SUPER_ADMIN: "🔑",
  LAND_OWNER: "🏡",
  LEASEHOLDER: "🌱",
};

interface RoleSelectorProps {
  roles: Role[];
  locale: string;
}

export default function RoleSelector({ roles, locale }: RoleSelectorProps) {
  const t = useTranslations();
  const { update } = useSession();
  const [loading, setLoading] = useState<Role | null>(null);

  async function selectRole(role: Role) {
    setLoading(role);
    await update({ activeRole: role });
    // Hard navigate so the server re-reads the updated JWT and routes correctly
    window.location.href = `/${locale}`;
  }

  return (
    <div className="space-y-3">
      {roles.map((role) => (
        <button
          key={role}
          onClick={() => selectRole(role)}
          disabled={loading !== null}
          className="w-full flex items-center gap-4 px-5 py-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-2xl">{ROLE_ICONS[role]}</span>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900">{t(`users.${role}`)}</p>
            <p className="text-xs text-gray-500">{t(`roleSelection.${role}`)}</p>
          </div>
          {loading === role && (
            <span className="ml-auto text-green-600 text-sm">...</span>
          )}
        </button>
      ))}
    </div>
  );
}
