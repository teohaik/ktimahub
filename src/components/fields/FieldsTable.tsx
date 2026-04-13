"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Field {
  id: string;
  name: string;
  fieldNumber: string | null;
  kaek: string;
  officialArea: number;
  calculatedArea: number | null;
  leaseholder: { id: string; name: string | null } | null;
}

interface Props {
  fields: Field[];
  locale: string;
}

export default function FieldsTable({ fields, locale }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [rows, setRows] = useState(fields);

  async function handleDelete(id: string) {
    if (!confirm(t("common.confirm") + "?")) return;
    setDeleting(id);
    await fetch(`/api/fields/${id}`, { method: "DELETE" });
    setRows((prev) => prev.filter((f) => f.id !== id));
    setDeleting(null);
  }

  function fmt(n: number | null | undefined) {
    if (n == null) return "—";
    return n.toLocaleString("el-GR", { maximumFractionDigits: 0 });
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg">{t("fields.addField")} →</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Mobile cards */}
      <div className="sm:hidden divide-y divide-gray-100">
        {rows.map((f, i) => (
          <div key={f.id} className="p-4 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-900">{f.name}</p>
                <p className="text-xs text-gray-500">
                  {f.kaek}
                  {f.fieldNumber && (
                    <span className="ml-2 text-gray-400">· {t("fields.fieldNumber")}: {f.fieldNumber}</span>
                  )}
                </p>
              </div>
              <span className="text-xs text-gray-400">#{i + 1}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 text-sm text-gray-600">
              <span>{t("fields.officialArea")}: {fmt(f.officialArea)}</span>
              <span>{t("fields.calculatedArea")}: {fmt(f.calculatedArea)}</span>
            </div>
            <p className="text-sm text-gray-600">
              {t("fields.leaseholder")}: {f.leaseholder?.name ?? t("fields.noLeaseholder")}
            </p>
            <div className="flex gap-2 pt-1">
              <Link
                href={`/${locale}/map?field=${f.id}`}
                className="text-xs text-blue-600 hover:underline"
              >
                {t("common.showOnMap")}
              </Link>
              <Link
                href={`/${locale}/fields/${f.id}`}
                className="text-xs text-green-600 hover:underline"
              >
                {t("common.edit")}
              </Link>
              <button
                onClick={() => handleDelete(f.id)}
                disabled={deleting === f.id}
                className="text-xs text-red-500 hover:underline disabled:opacity-50"
              >
                {t("common.delete")}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-green-700 text-white text-left text-xs">
              <th className="px-4 py-3 font-semibold">{t("fields.fieldId")}</th>
              <th className="px-4 py-3 font-semibold">{t("fields.kaek")}</th>
              <th className="px-4 py-3 font-semibold">{t("fields.name")}</th>
              <th className="px-4 py-3 font-semibold">{t("fields.fieldNumber")}</th>
              <th className="px-4 py-3 font-semibold text-right">{t("fields.officialArea")}</th>
              <th className="px-4 py-3 font-semibold text-right">{t("fields.calculatedArea")}</th>
              <th className="px-4 py-3 font-semibold">{t("fields.leaseholder")}</th>
              <th className="px-4 py-3 font-semibold">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((f, i) => (
              <tr
                key={f.id}
                className={`hover:bg-gray-50 transition-colors ${i % 2 === 1 ? "bg-gray-50/50" : ""}`}
              >
                <td className="px-4 py-3 text-gray-500 text-xs">{i + 1}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-700">{f.kaek}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{f.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-700">{f.fieldNumber ?? "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                  {fmt(f.officialArea)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                  {fmt(f.calculatedArea)}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {f.leaseholder?.name ?? (
                    <span className="text-gray-400 italic">{t("fields.noLeaseholder")}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/${locale}/map?field=${f.id}`}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title={t("common.showOnMap")}
                    >
                      <MapIcon />
                    </Link>
                    <Link
                      href={`/${locale}/fields/${f.id}`}
                      className="text-green-600 hover:text-green-800 transition-colors"
                      title={t("common.edit")}
                    >
                      <EditIcon />
                    </Link>
                    <button
                      onClick={() => handleDelete(f.id)}
                      disabled={deleting === f.id}
                      className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-40"
                      title={t("common.delete")}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7l6-3 5.447 2.724A1 1 0 0 1 21 7.618v10.764a1 1 0 0 1-1.447.894L15 17l-6 3z" />
      <path d="M9 7v13M15 4v13" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6M9 6V4h6v2" />
    </svg>
  );
}
