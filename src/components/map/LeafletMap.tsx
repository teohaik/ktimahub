"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Map as LMap, Polygon, TileLayer } from "leaflet";
import type { MapComponentProps, LatLng } from "@/lib/map/types";
import "@/lib/map/leaflet-icons";

// Greece bounding box center
const GREECE_CENTER: LatLng = { lat: 39.0742, lng: 21.8243 };
const DEFAULT_ZOOM = 7;

const TILE_LAYERS = {
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community",
    maxZoom: 19,
  },
};

export default function LeafletMap({
  viewport,
  polygons = [],
  onPolygonClick,
  onMapClick,
  drawingVertices = [],
  showSatellite = false,
  className = "",
}: MapComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);
  const tileLayerRef = useRef<TileLayer | null>(null);
  const polygonLayersRef = useRef<Map<string, Polygon>>(new Map());
  const drawingLayerRef = useRef<Polygon | null>(null);

  // Keep a stable ref to the latest onMapClick so the handler registered
  // during async map init always calls the current callback.
  const onMapClickRef = useRef(onMapClick);
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // --- Init map once ---
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Dynamic import to ensure no SSR
    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;

      const center = viewport?.center ?? GREECE_CENTER;
      const zoom = viewport?.zoom ?? DEFAULT_ZOOM;

      const map = L.map(containerRef.current, {
        center: [center.lat, center.lng],
        zoom,
        zoomControl: true,
      });

      // Initial tile layer
      const layer = L.tileLayer(
        showSatellite ? TILE_LAYERS.satellite.url : TILE_LAYERS.street.url,
        {
          attribution: showSatellite
            ? TILE_LAYERS.satellite.attribution
            : TILE_LAYERS.street.attribution,
          maxZoom: 19,
        }
      ).addTo(map);

      tileLayerRef.current = layer;

      // Register click handler here, after map is ready.
      // Uses ref so it always calls the latest callback without re-registering.
      map.on("click", (e) => {
        onMapClickRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      mapRef.current = map;
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      polygonLayersRef.current.clear();
      drawingLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Swap tile layer when satellite toggle changes ---
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      if (!mapRef.current) return;
      tileLayerRef.current?.remove();
      const cfg = showSatellite ? TILE_LAYERS.satellite : TILE_LAYERS.street;
      tileLayerRef.current = L.tileLayer(cfg.url, {
        attribution: cfg.attribution,
        maxZoom: cfg.maxZoom,
      }).addTo(mapRef.current);
    });
  }, [showSatellite]);

  // --- Render field polygons ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    import("leaflet").then((L) => {
      if (!map) return;

      const incoming = new Set(polygons.map((p) => p.id));

      // Remove stale
      for (const [id, layer] of polygonLayersRef.current) {
        if (!incoming.has(id)) {
          layer.remove();
          polygonLayersRef.current.delete(id);
        }
      }

      // Add / update
      for (const fp of polygons) {
        if (fp.vertices.length < 3) continue;
        const latlngs = fp.vertices.map(
          (v) => [v.lat, v.lng] as [number, number]
        );
        const existing = polygonLayersRef.current.get(fp.id);

        if (existing) {
          existing.setLatLngs(latlngs);
        } else {
          const poly = L.polygon(latlngs, {
            color: fp.color ?? "#1d4ed8",
            fillColor: fp.color ?? "#3b82f6",
            fillOpacity: 0.25,
            weight: 2,
          }).addTo(map);

          if (onPolygonClick) {
            poly.on("click", () => onPolygonClick(fp.id));
            poly.getElement()?.classList.add("cursor-pointer");
          }

          poly.bindTooltip(fp.name, { sticky: true });
          polygonLayersRef.current.set(fp.id, poly);
        }
      }
    });
  }, [polygons, onPolygonClick]);

  // --- Render in-progress drawing polygon ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    import("leaflet").then((L) => {
      if (!map) return;
      drawingLayerRef.current?.remove();
      drawingLayerRef.current = null;

      if (drawingVertices.length < 2) return;

      const latlngs = drawingVertices.map(
        (v) => [v.lat, v.lng] as [number, number]
      );

      drawingLayerRef.current = L.polygon(latlngs, {
        color: "#f59e0b",
        fillColor: "#fbbf24",
        fillOpacity: 0.2,
        weight: 2,
        dashArray: "6 4",
      }).addTo(map);
    });
  }, [drawingVertices]);

  // --- Fly to viewport when it changes externally ---
  useEffect(() => {
    if (!mapRef.current || !viewport) return;
    mapRef.current.flyTo(
      [viewport.center.lat, viewport.center.lng],
      viewport.zoom,
      { duration: 1 }
    );
  }, [viewport]);

  // --- Fit bounds to all polygons ---
  const fitAllPolygons = useCallback(() => {
    const map = mapRef.current;
    if (!map || polygons.length === 0) return;
    import("leaflet").then((L) => {
      if (!map) return;
      const allPoints = polygons.flatMap((p) =>
        p.vertices.map((v) => [v.lat, v.lng] as [number, number])
      );
      if (allPoints.length > 0) {
        map.fitBounds(L.latLngBounds(allPoints), { padding: [40, 40] });
      }
    });
  }, [polygons]);

  // Auto-fit when polygons first load
  useEffect(() => {
    fitAllPolygons();
    // Only on first meaningful load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polygons.length > 0]);

  return (
    <div
      ref={containerRef}
      className={`w-full rounded-lg overflow-hidden ${className}`}
      style={{ minHeight: "400px" }}
    />
  );
}
