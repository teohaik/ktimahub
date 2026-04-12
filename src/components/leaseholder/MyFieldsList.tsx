"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type CropType = "WHEAT" | "BARLEY" | "COTTON" | "VETCH" | "CLOVER";

interface CropHistory {
  id: string;
  year: number;
  cropType: CropType;
}

interface Field {
  id: string;
  name: string;
  kaek: string;
  officialArea: number;
  cropHistory: CropHistory[];
}

const CROPS: CropType[] = ["WHEAT", "BARLEY", "COTTON", "VETCH", "CLOVER"];

export default function MyFieldsList({
  fields,
  currentYear,
}: {
  fields: Field[];
  currentYear: number;
}) {
  const t = useTranslations();

  if (fields.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p>{t("fields.noLeaseholder")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <FieldCard
          key={field.id}
          field={field}
          currentYear={currentYear}
        />
      ))}
    </div>
  );
}

function FieldCard({
  field,
  currentYear,
}: {
  field: Field;
  currentYear: number;
}) {
  const t = useTranslations();
  const currentCrop = field.cropHistory.find((c) => c.year === currentYear);
  const [selectedCrop, setSelectedCrop] = useState<CropType | "">(
    currentCrop?.cropType ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!selectedCrop) return;
    setSaving(true);
    setSaved(false);
    await fetch("/api/crops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fieldId: field.id,
        year: currentYear,
        cropType: selectedCrop,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const history = field.cropHistory.filter((c) => c.year !== currentYear);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-green-700 text-white px-5 py-3">
        <h2 className="font-semibold text-base">{field.name}</h2>
        <p className="text-green-200 text-xs">ΚΑΕΚ: {field.kaek}</p>
      </div>

      <div className="p-5 space-y-4">
        {/* Current year crop */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            {t("crops.currentYear")} ({currentYear})
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedCrop}
              onChange={(e) => { setSelectedCrop(e.target.value as CropType | ""); setSaved(false); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[180px]"
            >
              <option value="">{t("crops.noCrop")}</option>
              {CROPS.map((c) => (
                <option key={c} value={c}>
                  {t(`crops.${c}`)}
                </option>
              ))}
            </select>
            <button
              onClick={handleSave}
              disabled={saving || !selectedCrop}
              className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "..." : saved ? "✓" : t("crops.setCrop")}
            </button>
          </div>
        </div>

        {/* Crop history */}
        {history.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              {t("crops.history")}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="bg-gray-50 rounded-lg px-3 py-2 text-center"
                >
                  <p className="text-xs text-gray-500">{h.year}</p>
                  <p className="text-sm font-medium text-gray-800">
                    {t(`crops.${h.cropType}`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
