"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import MapContainer from "./MapContainer";
import type { FieldPolygon } from "@/lib/map/types";

interface MapViewProps {
  polygons: FieldPolygon[];
}

export default function MapView({ polygons }: MapViewProps) {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(
    searchParams.get("field")
  );

  // If ?field=id is in the URL, highlight that field
  useEffect(() => {
    const id = searchParams.get("field");
    if (id) setSelectedId(id);
  }, [searchParams]);

  const selected = polygons.find((p) => p.id === selectedId);

  // When a specific field is requested, focus viewport on it
  const viewport = selected
    ? {
        center: {
          lat:
            selected.vertices.reduce((s, v) => s + v.lat, 0) /
            selected.vertices.length,
          lng:
            selected.vertices.reduce((s, v) => s + v.lng, 0) /
            selected.vertices.length,
        },
        zoom: 16,
      }
    : undefined;

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        {polygons.length} {t("map.allFields").toLowerCase()}
      </p>

      {selected && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-800 flex items-center justify-between">
          <div>
            <span className="font-medium">{selected.name}</span>
            <span className="ml-3 text-blue-600 text-xs">
              {selected.vertices.length} κορυφές
            </span>
          </div>
          <button
            onClick={() => setSelectedId(null)}
            className="text-blue-500 hover:text-blue-700 ml-4"
          >
            ✕
          </button>
        </div>
      )}

      <MapContainer
        polygons={polygons.map((p) => ({
          ...p,
          color: p.id === selectedId ? "#dc2626" : undefined,
        }))}
        onPolygonClick={setSelectedId}
        viewport={viewport}
        showLayerToggle
        height="calc(100vh - 220px)"
      />
    </div>
  );
}
