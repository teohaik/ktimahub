"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import DynamicMap from "./DynamicMap";
import type { MapComponentProps, LatLng } from "@/lib/map/types";

interface MapContainerProps extends Omit<MapComponentProps, "showSatellite"> {
  /** Show the satellite/street toggle button */
  showLayerToggle?: boolean;
  /** Show the GPS "add current location" button */
  showGpsButton?: boolean;
  /** Called when GPS button is pressed and location is resolved */
  onGpsLocation?: (latlng: LatLng) => void;
  height?: string;
}

export default function MapContainer({
  showLayerToggle = true,
  showGpsButton = false,
  onGpsLocation,
  height = "500px",
  ...mapProps
}: MapContainerProps) {
  const t = useTranslations();
  const [satellite, setSatellite] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");

  const handleGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation not supported");
      return;
    }
    setGpsLoading(true);
    setGpsError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        onGpsLocation?.({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        setGpsLoading(false);
        setGpsError("Could not get location");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onGpsLocation]);

  return (
    <div className="relative w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm"
      style={{ height }}>
      <DynamicMap
        {...mapProps}
        showSatellite={satellite}
        className="w-full h-full"
      />

      {/* Layer toggle */}
      {showLayerToggle && (
        <button
          type="button"
          onClick={() => setSatellite((s) => !s)}
          className="absolute top-3 right-3 z-[1000] bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-medium shadow hover:bg-gray-50 transition-colors"
        >
          {satellite ? t("map.street") : t("map.satellite")}
        </button>
      )}

      {/* GPS button */}
      {showGpsButton && (
        <button
          type="button"
          onClick={handleGps}
          disabled={gpsLoading}
          title={t("fields.addCurrentLocation")}
          className="absolute bottom-8 right-3 z-[1000] bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium shadow hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          {gpsLoading ? (
            <LoadingSpinner />
          ) : (
            <LocationIcon />
          )}
          <span className="hidden sm:inline">{t("fields.addCurrentLocation")}</span>
        </button>
      )}

      {gpsError && (
        <div className="absolute bottom-20 right-3 z-[1000] bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 max-w-[200px]">
          {gpsError}
        </div>
      )}
    </div>
  );
}

function LocationIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      <circle cx="12" cy="12" r="8" strokeDasharray="4 2" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
