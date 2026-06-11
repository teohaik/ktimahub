"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";

interface CropOption { id: string; nameEl: string; nameEn: string }
interface LeaseholderOption { id: string; name: string | null }
interface YearRecord {
  cropId: string | null;
  leaseholderId: string | null;
  crop: CropOption | null;
  leaseholder: LeaseholderOption | null;
}
interface FieldRow {
  field: { id: string; name: string; kaek: string; fieldNumber: string | null };
  yearRecord: YearRecord | null;
}

interface Props {
  initialRows: FieldRow[];
  crops: CropOption[];
  leaseholders: LeaseholderOption[];
  initialYear: number;
}

const START_YEAR = 2025;

function buildYears() {
  const end = new Date().getFullYear() + 5;
  const years: number[] = [];
  for (let y = START_YEAR; y <= end; y++) years.push(y);
  return years;
}

export default function CropHistoryTable({ initialRows, crops, leaseholders, initialYear }: Props) {
  const t = useTranslations("cropHistory");
  const locale = useLocale();
  const years = buildYears();

  const [year, setYear] = useState(initialYear);
  const [rows, setRows] = useState<FieldRow[]>(initialRows);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [pending, setPending] = useState<Map<string, { cropId: string | null; leaseholderId: string | null }>>(new Map());
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);

  const fetchYear = useCallback(async (y: number) => {
    setLoading(true);
    const res = await fetch(`/api/crop-history?year=${y}`);
    if (res.ok) setRows(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchYear(year);
  }, [year, fetchYear]);

  function handleYearChange(y: number) {
    setYear(y);
    setEditMode(false);
    setPending(new Map());
  }

  function handleEdit() {
    const initial = new Map<string, { cropId: string | null; leaseholderId: string | null }>();
    rows.forEach(({ field, yearRecord }) => {
      initial.set(field.id, {
        cropId: yearRecord?.cropId ?? null,
        leaseholderId: yearRecord?.leaseholderId ?? null,
      });
    });
    setPending(initial);
    setEditMode(true);
  }

  async function handleCopyFromPrevYear() {
    setCopying(true);
    const res = await fetch(`/api/crop-history?year=${year - 1}`);
    setCopying(false);
    if (!res.ok) return;
    const prevRows: FieldRow[] = await res.json();
    const prevByField = Object.fromEntries(
      prevRows.map(({ field, yearRecord }) => [field.id, yearRecord])
    );
    const initial = new Map<string, { cropId: string | null; leaseholderId: string | null }>();
    rows.forEach(({ field, yearRecord }) => {
      const prev = prevByField[field.id];
      initial.set(field.id, {
        // If current year already has a value keep it, otherwise copy from prev year
        cropId: yearRecord?.cropId ?? prev?.cropId ?? null,
        leaseholderId: yearRecord?.leaseholderId ?? prev?.leaseholderId ?? null,
      });
    });
    setPending(initial);
    setEditMode(true);
  }

  function handleCancel() {
    setEditMode(false);
    setPending(new Map());
  }

  async function handleSave() {
    setSaving(true);
    await Promise.all(
      Array.from(pending.entries()).map(([fieldId, data]) =>
        fetch(`/api/crop-history/${fieldId}/${year}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
      )
    );
    setSaving(false);
    setEditMode(false);
    setPending(new Map());
    await fetchYear(year);
  }

  function setPendingField(fieldId: string, key: "cropId" | "leaseholderId", value: string | null) {
    setPending((prev) => {
      const next = new Map(prev);
      const cur = next.get(fieldId) ?? { cropId: null, leaseholderId: null };
      next.set(fieldId, { ...cur, [key]: value || null });
      return next;
    });
  }

  const cropName = (c: CropOption) => locale.startsWith("el") ? c.nameEl : c.nameEn;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">{t("year")}:</label>
          <select
            value={year}
            onChange={(e) => handleYearChange(parseInt(e.target.value))}
            disabled={editMode}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              {year > START_YEAR && (
                <button
                  onClick={handleCopyFromPrevYear}
                  disabled={saving || copying}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  {copying ? t("copying") : t("copyFromYear", { year: year - 1 })}
                </button>
              )}
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {saving ? t("saving") : t("save")}
              </button>
            </>
          ) : (
            <button
              onClick={handleEdit}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {t("edit")}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-opacity ${loading ? "opacity-50" : ""}`}>
        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-gray-100">
          {rows.map(({ field, yearRecord }, i) => {
            const p = pending.get(field.id);
            const activeCropId = editMode ? (p?.cropId ?? null) : yearRecord?.cropId ?? null;
            const activeLeaseholderId = editMode ? (p?.leaseholderId ?? null) : yearRecord?.leaseholderId ?? null;
            const displayCrop = crops.find((c) => c.id === activeCropId);
            const displayLeaseholder = leaseholders.find((l) => l.id === activeLeaseholderId);
            return (
              <div key={field.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">{field.name}</p>
                  <span className="text-xs text-gray-400">#{i + 1}</span>
                </div>
                <p className="text-xs font-mono text-gray-500">{field.kaek}</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-24 shrink-0">{t("colCrop")}:</span>
                    {editMode ? (
                      <select
                        value={activeCropId ?? ""}
                        onChange={(e) => setPendingField(field.id, "cropId", e.target.value)}
                        className="flex-1 text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">{t("noCrop")}</option>
                        {crops.map((c) => <option key={c.id} value={c.id}>{cropName(c)}</option>)}
                      </select>
                    ) : (
                      <span className="text-sm text-gray-700">{displayCrop ? cropName(displayCrop) : <span className="text-gray-400 italic">{t("noCrop")}</span>}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-24 shrink-0">{t("colLeaseholder")}:</span>
                    {editMode ? (
                      <select
                        value={activeLeaseholderId ?? ""}
                        onChange={(e) => setPendingField(field.id, "leaseholderId", e.target.value)}
                        className="flex-1 text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">{t("noLeaseholder")}</option>
                        {leaseholders.map((l) => <option key={l.id} value={l.id}>{l.name ?? l.id}</option>)}
                      </select>
                    ) : (
                      <span className="text-sm text-gray-700">{displayLeaseholder?.name ?? <span className="text-gray-400 italic">{t("noLeaseholder")}</span>}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-green-700 text-white text-left text-xs">
                <th className="px-4 py-3 font-semibold w-10">#</th>
                <th className="px-4 py-3 font-semibold">{t("colField")}</th>
                <th className="px-4 py-3 font-semibold">{t("colKaek")}</th>
                <th className="px-4 py-3 font-semibold">{t("colCrop")}</th>
                <th className="px-4 py-3 font-semibold">{t("colLeaseholder")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(({ field, yearRecord }, i) => {
                const p = pending.get(field.id);
                const activeCropId = editMode ? (p?.cropId ?? null) : yearRecord?.cropId ?? null;
                const activeLeaseholderId = editMode ? (p?.leaseholderId ?? null) : yearRecord?.leaseholderId ?? null;
                const displayCrop = crops.find((c) => c.id === activeCropId);
                const displayLeaseholder = leaseholders.find((l) => l.id === activeLeaseholderId);
                return (
                  <tr key={field.id} className={`${i % 2 === 1 ? "bg-gray-50/50" : ""} hover:bg-green-50/40 transition-colors`}>
                    <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{field.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{field.kaek}</td>
                    <td className="px-4 py-3">
                      {editMode ? (
                        <select
                          value={activeCropId ?? ""}
                          onChange={(e) => setPendingField(field.id, "cropId", e.target.value)}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white min-w-[150px]"
                        >
                          <option value="">{t("noCrop")}</option>
                          {crops.map((c) => <option key={c.id} value={c.id}>{cropName(c)}</option>)}
                        </select>
                      ) : displayCrop ? (
                        <span className="text-gray-700">{cropName(displayCrop)}</span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">{t("noCrop")}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editMode ? (
                        <select
                          value={activeLeaseholderId ?? ""}
                          onChange={(e) => setPendingField(field.id, "leaseholderId", e.target.value)}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white min-w-[150px]"
                        >
                          <option value="">{t("noLeaseholder")}</option>
                          {leaseholders.map((l) => <option key={l.id} value={l.id}>{l.name ?? l.id}</option>)}
                        </select>
                      ) : displayLeaseholder?.name ? (
                        <span className="text-gray-700">{displayLeaseholder.name}</span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">{t("noLeaseholder")}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400">{t("noFields")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
