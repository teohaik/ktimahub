"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import MapContainer from "@/components/map/MapContainer";
import { parseLandRegistryCoordinates, calculatePolygonArea } from "@/lib/map/coords";
import type { LatLng } from "@/lib/map/types";

interface Leaseholder {
  id: string;
  name: string | null;
}

interface CropOption {
  id: string;
  nameEl: string;
  nameEn: string;
}

interface FieldFormProps {
  leaseholders: Leaseholder[];
  crops?: CropOption[];
  prevId?: string | null;
  nextId?: string | null;
  fieldIndex?: number;
  totalFields?: number;
  initial?: {
    id: string;
    name: string;
    fieldNumber: string | null;
    kaek: string;
    atak: string | null;
    officialArea: number;
    calculatedArea: number | null;
    polygon: LatLng[] | null;
    leaseholderId: string | null;
    cropId?: string | null;
  };
}

type PolygonMode = "draw" | "paste";

export default function FieldForm({ leaseholders, crops = [], initial, prevId, nextId, fieldIndex, totalFields }: FieldFormProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const isEdit = !!initial;

  // Form fields
  const [name, setName] = useState(initial?.name ?? "");
  const [fieldNumber, setFieldNumber] = useState(initial?.fieldNumber ?? "");
  const [kaek, setKaek] = useState(initial?.kaek ?? "");
  const [atak, setAtak] = useState(initial?.atak ?? "");
  const [officialArea, setOfficialArea] = useState(
    initial?.officialArea?.toString() ?? ""
  );
  const [calculatedArea, setCalculatedArea] = useState(
    initial?.calculatedArea?.toFixed(0) ?? ""
  );
  const [leaseholderId, setLeaseholderId] = useState(
    initial?.leaseholderId ?? ""
  );
  const [cropId, setCropId] = useState(initial?.cropId ?? "");

  // Polygon state
  const [mode, setMode] = useState<PolygonMode>("draw");
  const [vertices, setVertices] = useState<LatLng[]>(initial?.polygon ?? []);
  const [pasteText, setPasteText] = useState("");
  const [pasteError, setPasteError] = useState("");

  // Map fullscreen
  const [mapFullscreen, setMapFullscreen] = useState(false);

  // Saving state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Update calculated area whenever vertices change
  const updateCalcArea = useCallback((verts: LatLng[]) => {
    if (verts.length >= 3) {
      setCalculatedArea(calculatePolygonArea(verts).toFixed(0));
    } else {
      setCalculatedArea("");
    }
  }, []);

  const handleMapClick = useCallback(
    (latlng: LatLng) => {
      if (mode !== "draw") return;
      setVertices((prev) => {
        const next = [...prev, latlng];
        updateCalcArea(next);
        return next;
      });
    },
    [mode, updateCalcArea]
  );

  const handleGpsLocation = useCallback(
    (latlng: LatLng) => {
      setVertices((prev) => {
        const next = [...prev, latlng];
        updateCalcArea(next);
        return next;
      });
    },
    [updateCalcArea]
  );

  function removeVertex(index: number) {
    setVertices((prev) => {
      const next = prev.filter((_, i) => i !== index);
      updateCalcArea(next);
      return next;
    });
  }

  const handleVertexMove = useCallback(
    (index: number, latlng: LatLng) => {
      setVertices((prev) => {
        const next = [...prev];
        next[index] = latlng;
        updateCalcArea(next);
        return next;
      });
    },
    [updateCalcArea]
  );

  const handleVertexDelete = useCallback((index: number) => {
    setVertices((prev) => {
      const next = prev.filter((_, i) => i !== index);
      updateCalcArea(next);
      return next;
    });
  }, [updateCalcArea]);

  function handleImportCoordinates() {
    setPasteError("");
    try {
      const parsed = parseLandRegistryCoordinates(pasteText);
      setVertices(parsed);
      updateCalcArea(parsed);
      // Auto-fill official area with calculated value
      setOfficialArea(calculatePolygonArea(parsed).toFixed(0));
    } catch (err) {
      setPasteError((err as Error).message);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !kaek) return;
    setSaving(true);
    setError("");

    const body = {
      name,
      fieldNumber: fieldNumber || null,
      kaek,
      atak: atak || null,
      officialArea,
      polygon: vertices.length >= 3 ? vertices : null,
      leaseholderId: leaseholderId || null,
      cropId: cropId || null,
    };

    const res = await fetch(
      isEdit ? `/api/fields/${initial!.id}` : "/api/fields",
      {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error saving field");
      return;
    }

    router.push(`/${locale}/fields`);
    router.refresh();
  }

  const ActionButtons = ({ compact }: { compact?: boolean }) => (
    <div className={`flex gap-2 ${compact ? "" : ""}`}>
      <button
        type="button"
        onClick={() => router.push(`/${locale}/fields`)}
        className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
      >
        {t("common.cancel")}
      </button>
      <button
        type="submit"
        disabled={saving}
        className="px-5 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {saving ? "..." : t("common.save")}
      </button>
    </div>
  );

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Top action bar: navigation + save/cancel */}
      {isEdit && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => prevId && router.push(`/${locale}/fields/${prevId}`)}
              disabled={!prevId}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title={t("common.previous")}
            >
              <ChevronLeftIcon />
            </button>
            {totalFields != null && fieldIndex != null && (
              <span className="text-sm text-gray-500 tabular-nums">
                {fieldIndex + 1} / {totalFields}
              </span>
            )}
            <button
              type="button"
              onClick={() => nextId && router.push(`/${locale}/fields/${nextId}`)}
              disabled={!nextId}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title={t("common.next")}
            >
              <ChevronRightIcon />
            </button>
          </div>
          <ActionButtons />
        </div>
      )}

      {/* Basic info */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">
          {isEdit ? t("fields.editField") : t("fields.addField")}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t("fields.name")} required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={inputCls}
            />
          </FormField>

          <FormField label={t("fields.fieldNumber")}>
            <input
              type="text"
              value={fieldNumber}
              onChange={(e) => setFieldNumber(e.target.value)}
              className={inputCls}
            />
          </FormField>

          <FormField label={t("fields.kaek")} required>
            <input
              type="text"
              value={kaek}
              onChange={(e) => setKaek(e.target.value)}
              required
              className={inputCls}
            />
          </FormField>

          <FormField label={t("fields.atak")}>
            <input
              type="text"
              value={atak}
              onChange={(e) => setAtak(e.target.value)}
              className={inputCls}
            />
          </FormField>

          <FormField label={t("fields.officialArea")}>
            <input
              type="number"
              step="0.01"
              min="0"
              value={officialArea}
              onChange={(e) => setOfficialArea(e.target.value)}
              className={inputCls}
            />
          </FormField>

          <FormField label={t("fields.calculatedArea")}>
            <input
              type="text"
              value={calculatedArea ? Number(calculatedArea).toLocaleString("el-GR") : "—"}
              readOnly
              className={`${inputCls} bg-gray-50 text-gray-500 cursor-not-allowed`}
            />
          </FormField>

          <FormField label={t("fields.leaseholder")}>
            <select
              value={leaseholderId}
              onChange={(e) => setLeaseholderId(e.target.value)}
              className={inputCls}
            >
              <option value="">{t("fields.noLeaseholder")}</option>
              {leaseholders.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </FormField>

          {crops.length > 0 && (
            <FormField label={t("fields.crop")}>
              <select
                value={cropId}
                onChange={(e) => setCropId(e.target.value)}
                className={inputCls}
              >
                <option value="">{t("fields.noCrop")}</option>
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>{locale === "el" ? c.nameEl : c.nameEn}</option>
                ))}
              </select>
            </FormField>
          )}
        </div>
      </div>

      {/* Polygon input */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
        {/* Segmented control */}
        <div className="flex rounded-lg border border-gray-200 p-1 w-fit gap-1">
          <SegmentButton
            active={mode === "draw"}
            onClick={() => setMode("draw")}
          >
            {t("fields.drawMode")}
          </SegmentButton>
          <SegmentButton
            active={mode === "paste"}
            onClick={() => setMode("paste")}
          >
            {t("fields.pasteMode")}
          </SegmentButton>
        </div>

        {mode === "draw" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Κλικ → προσθήκη κορυφής · Σύρσιμο → μετακίνηση · Δεξί κλικ → διαγραφή
              </p>
              <button
                type="button"
                onClick={() => setMapFullscreen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
              >
                <ExpandIcon />
                {t("fields.fullscreen")}
              </button>
            </div>
            <MapContainer
              polygons={
                vertices.length >= 3
                  ? [{ id: "draft", name, vertices }]
                  : []
              }
              drawingVertices={vertices}
              onMapClick={handleMapClick}
              onVertexMove={handleVertexMove}
              onVertexDelete={handleVertexDelete}
              onGpsLocation={handleGpsLocation}
              showLayerToggle
              showGpsButton
              height="380px"
            />

            {vertices.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-700">
                    {vertices.length} κορυφές
                  </p>
                  <button
                    type="button"
                    onClick={() => { setVertices([]); setCalculatedArea(""); }}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t("fields.clearPolygon")}
                  </button>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {vertices.map((v, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-gray-50 rounded px-2 py-1 text-xs font-mono text-gray-600"
                    >
                      <span>
                        {i + 1}. {v.lat.toFixed(6)}, {v.lng.toFixed(6)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeVertex(i)}
                        className="text-red-400 hover:text-red-600 ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {mode === "paste" && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              {t("fields.pasteCoordinates")} (ΕΓΣΑ87 / EPSG:2100)
            </p>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={8}
              placeholder={"A/A\tX\t\t\tY\n0\t416623.92\t4489235.86\n1\t416637.22\t4489226.52"}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {pasteError && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {pasteError}
              </p>
            )}
            <button
              type="button"
              onClick={handleImportCoordinates}
              disabled={!pasteText.trim()}
              className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {t("fields.importCoordinates")}
            </button>

            {vertices.length >= 3 && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-800">
                ✓ {vertices.length} κορυφές εισήχθησαν — εμβαδόν:{" "}
                {Number(calculatedArea).toLocaleString("el-GR")} τ.μ.
              </div>
            )}

            {vertices.length >= 3 && (
              <MapContainer
                polygons={[{ id: "draft", name, vertices }]}
                showLayerToggle
                height="300px"
              />
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <ActionButtons />
      </div>
    </form>

    {/* Fullscreen map overlay */}
    {mapFullscreen && (
      <div className="fixed inset-0 z-[2000] flex flex-col bg-white">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0">
          <span className="text-sm font-medium text-gray-700">
            {vertices.length > 0
              ? `${vertices.length} κορυφές`
              : "Κάντε κλικ στον χάρτη για να προσθέσετε κορυφές"}
          </span>
          <button
            type="button"
            onClick={() => setMapFullscreen(false)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            {t("fields.doneDrawing")}
          </button>
        </div>
        {/* Full-height map */}
        <div className="flex-1 min-h-0">
          <MapContainer
            polygons={
              vertices.length >= 3
                ? [{ id: "draft", name, vertices }]
                : []
            }
            drawingVertices={vertices}
            onMapClick={handleMapClick}
            onVertexMove={handleVertexMove}
            onVertexDelete={handleVertexDelete}
            onGpsLocation={handleGpsLocation}
            showLayerToggle
            showGpsButton
            height="100%"
          />
        </div>
      </div>
    )}
    </>
  );
}

const inputCls =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent";

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

function SegmentButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
        active
          ? "bg-green-600 text-white shadow-sm"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}
