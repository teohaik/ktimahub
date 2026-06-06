"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface Crop {
  id: string;
  name: string;
}

export default function CropsManager({ initialCrops }: { initialCrops: Crop[] }) {
  const t = useTranslations("crops");
  const [crops, setCrops] = useState(initialCrops);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/crop-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Error"); return; }
    setCrops((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name, "el")));
    setNewName("");
  }

  async function handleSaveEdit(id: string) {
    if (!editName.trim()) return;
    setSaving(true);
    setError("");
    const res = await fetch(`/api/crop-types/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Error"); return; }
    setCrops((prev) => prev.map((c) => c.id === id ? data : c).sort((a, b) => a.name.localeCompare(b.name, "el")));
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    const res = await fetch(`/api/crop-types/${id}`, { method: "DELETE" });
    if (res.ok) setCrops((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="max-w-lg space-y-6">
      {/* Add form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t("namePlaceholder")}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          type="submit"
          disabled={saving || !newName.trim()}
          className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {t("add")}
        </button>
      </form>

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        {crops.length === 0 && (
          <p className="px-4 py-6 text-sm text-gray-400 text-center">{t("empty")}</p>
        )}
        {crops.map((crop) => (
          <div key={crop.id} className="flex items-center gap-3 px-4 py-3">
            {editingId === crop.id ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                  className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(crop.id); if (e.key === "Escape") setEditingId(null); }}
                />
                <button onClick={() => handleSaveEdit(crop.id)} disabled={saving} className="text-sm text-green-700 hover:text-green-900 font-medium disabled:opacity-50">
                  {t("save")}
                </button>
                <button onClick={() => setEditingId(null)} className="text-sm text-gray-500 hover:text-gray-700">
                  {t("cancel")}
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-gray-900">{crop.name}</span>
                <button onClick={() => { setEditingId(crop.id); setEditName(crop.name); }} className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
                  {t("edit")}
                </button>
                <button onClick={() => handleDelete(crop.id)} className="text-sm text-red-500 hover:text-red-700 transition-colors">
                  {t("delete")}
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
