"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import MapContainer from "./MapContainer";
import type { FieldPolygon } from "@/lib/map/types";

interface MapViewProps {
  polygons: FieldPolygon[];
}

export default function MapView({ polygons }: MapViewProps) {
  const t = useTranslations();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = polygons.find((p) => p.id === selectedId);

  return (
    <div className="space-y-3">
      {/* Field count badge */}
      <p className="text-sm text-gray-500">
        {polygons.length} {t("map.allFields").toLowerCase()}
      </p>

      {/* Selected field info */}
      {selected && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-800 flex items-center justify-between">
          <span className="font-medium">{selected.name}</span>
          <button
            onClick={() => setSelectedId(null)}
            className="text-blue-500 hover:text-blue-700 ml-4"
          >
            ✕
          </button>
        </div>
      )}

      <MapContainer
        polygons={polygons}
        onPolygonClick={setSelectedId}
        showLayerToggle
        height="calc(100vh - 220px)"
      />
    </div>
  );
}
