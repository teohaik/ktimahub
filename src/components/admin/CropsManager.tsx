"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface Crop {
  id: string;
  nameEl: string;
  nameEn: string;
}

interface EditState {
  nameEl: string;
  nameEn: string;
}

const inputCls = "flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500";

export default function CropsManager({ initialCrops }: { initialCrops: Crop[] }) {
  const t = useTranslations("crops");
  const [crops, setCrops] = useState(initialCrops);
  const [newEl, setNewEl] = useState("");
  const [newEn, setNewEn] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState>({ nameEl: "", nameEn: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newEl.trim() || !newEn.trim()) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/crop-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nameEl: newEl.trim(), nameEn: newEn.trim() }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Error"); return; }
    setCrops((prev) => [...prev, data].sort((a, b) => a.nameEl.localeCompare(b.nameEl, "el")));
    setNewEl("");
    setNewEn("");
  }

  async function handleSaveEdit(id: string) {
    if (!edit.nameEl.trim() || !edit.nameEn.trim()) return;
    setSaving(true);
    setError("");
    const res = await fetch(`/api/crop-types/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nameEl: edit.nameEl.trim(), nameEn: edit.nameEn.trim() }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Error"); return; }
    setCrops((prev) => prev.map((c) => c.id === id ? data : c).sort((a, b) => a.nameEl.localeCompare(b.nameEl, "el")));
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    const res = await fetch(`/api/crop-types/${id}`, { method: "DELETE" });
    if (res.ok) setCrops((prev) => prev.filter((c) => c.id !== id));
  }

  const nameMismatch = (el: string, en: string) => el.trim() && en.trim() && el.trim() === en.trim();

  return (
    <div className="space-y-6">
      {/* Add form */}
      <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">{t("addTitle")}</h2>
        <div className="flex gap-3 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-gray-500">{t("nameEl")}</label>
            <input
              type="text"
              value={newEl}
              onChange={(e) => setNewEl(e.target.value)}
              placeholder={t("nameElPlaceholder")}
              className={inputCls}
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-gray-500">{t("nameEn")}</label>
            <input
              type="text"
              value={newEn}
              onChange={(e) => setNewEn(e.target.value)}
              placeholder={t("nameEnPlaceholder")}
              className={inputCls}
            />
          </div>
          <button
            type="submit"
            disabled={saving || !newEl.trim() || !newEn.trim()}
            className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {t("add")}
          </button>
        </div>
        {nameMismatch(newEl, newEn) && (
          <p className="mt-2 text-xs text-amber-600">{t("namesSameWarning")}</p>
        )}
      </form>

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left w-24">{t("colId")}</th>
              <th className="px-4 py-3 text-left">{t("nameEl")}</th>
              <th className="px-4 py-3 text-left">{t("nameEn")}</th>
              <th className="px-4 py-3 text-left">{t("colActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {crops.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-sm text-gray-400 text-center">{t("empty")}</td>
              </tr>
            )}
            {crops.map((crop) => (
              <tr key={crop.id} className="hover:bg-gray-50">
                {/* Truncated ID with full value in title tooltip */}
                <td
                  className="px-4 py-3 font-mono text-xs text-gray-400 whitespace-nowrap"
                  title={crop.id}
                  data-cropid={crop.id}
                >
                  {crop.id.slice(0, 8)}…
                </td>
                {editingId === crop.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={edit.nameEl}
                        onChange={(e) => setEdit((s) => ({ ...s, nameEl: e.target.value }))}
                        autoFocus
                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        onKeyDown={(e) => { if (e.key === "Escape") setEditingId(null); }}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={edit.nameEn}
                        onChange={(e) => setEdit((s) => ({ ...s, nameEn: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        onKeyDown={(e) => { if (e.key === "Escape") setEditingId(null); }}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-3">
                        <button onClick={() => handleSaveEdit(crop.id)} disabled={saving} className="text-sm text-green-700 hover:text-green-900 font-medium disabled:opacity-50">
                          {t("save")}
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-sm text-gray-500 hover:text-gray-700">
                          {t("cancel")}
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-gray-900">
                      {crop.nameEl}
                      {nameMismatch(crop.nameEl, crop.nameEn) && (
                        <span className="ml-1 text-amber-500" title={t("namesSameWarning")}>⚠</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-900">{crop.nameEn}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button onClick={() => { setEditingId(crop.id); setEdit({ nameEl: crop.nameEl, nameEn: crop.nameEn }); }} className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
                          {t("edit")}
                        </button>
                        <button onClick={() => handleDelete(crop.id)} className="text-sm text-red-500 hover:text-red-700 transition-colors">
                          {t("delete")}
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
