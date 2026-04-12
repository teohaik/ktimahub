"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { Map as LMap, Polygon, TileLayer, Marker } from "leaflet";
import type { MapComponentProps, LatLng } from "@/lib/map/types";
import "@/lib/map/leaflet-icons";

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
  onVertexMove,
  onVertexDelete,
  showSatellite = false,
  className = "",
}: MapComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);
  const tileLayerRef = useRef<TileLayer | null>(null);
  const polygonLayersRef = useRef<Map<string, Polygon>>(new Map());
  const drawingLayerRef = useRef<Polygon | null>(null);
  const vertexMarkersRef = useRef<Marker[]>([]);

  // mapReady triggers all render effects after the async Leaflet init completes
  const [mapReady, setMapReady] = useState(false);

  // Keep latest callbacks in refs so handlers registered once always call current versions
  const onMapClickRef = useRef(onMapClick);
  const onVertexMoveRef = useRef(onVertexMove);
  const onVertexDeleteRef = useRef(onVertexDelete);
  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => { onVertexMoveRef.current = onVertexMove; }, [onVertexMove]);
  useEffect(() => { onVertexDeleteRef.current = onVertexDelete; }, [onVertexDelete]);

  // --- Init map once ---
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;

      const center = viewport?.center ?? GREECE_CENTER;
      const zoom = viewport?.zoom ?? DEFAULT_ZOOM;

      const map = L.map(containerRef.current, {
        center: [center.lat, center.lng],
        zoom,
        zoomControl: true,
      });

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

      // Register map click via ref — always calls current callback
      map.on("click", (e) => {
        onMapClickRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      mapRef.current = map;
      setMapReady(true); // triggers all render effects
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      polygonLayersRef.current.clear();
      drawingLayerRef.current = null;
      vertexMarkersRef.current = [];
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Swap tile layer ---
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    import("leaflet").then((L) => {
      if (!mapRef.current) return;
      tileLayerRef.current?.remove();
      const cfg = showSatellite ? TILE_LAYERS.satellite : TILE_LAYERS.street;
      tileLayerRef.current = L.tileLayer(cfg.url, {
        attribution: cfg.attribution,
        maxZoom: cfg.maxZoom,
      }).addTo(mapRef.current);
    });
  }, [mapReady, showSatellite]);

  // --- Render field polygons ---
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    import("leaflet").then((L) => {
      if (!map) return;

      const incoming = new Set(polygons.map((p) => p.id));

      for (const [id, layer] of polygonLayersRef.current) {
        if (!incoming.has(id)) {
          layer.remove();
          polygonLayersRef.current.delete(id);
        }
      }

      for (const fp of polygons) {
        if (fp.vertices.length < 3) continue;
        const latlngs = fp.vertices.map((v) => [v.lat, v.lng] as [number, number]);
        const existing = polygonLayersRef.current.get(fp.id);

        if (existing) {
          existing.setLatLngs(latlngs);
          existing.setStyle({ color: fp.color ?? "#1d4ed8", fillColor: fp.color ?? "#3b82f6" });
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
  }, [mapReady, polygons, onPolygonClick]);

  // --- Render in-progress drawing polygon ---
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    import("leaflet").then((L) => {
      if (!map) return;
      drawingLayerRef.current?.remove();
      drawingLayerRef.current = null;

      if (drawingVertices.length < 2) return;

      drawingLayerRef.current = L.polygon(
        drawingVertices.map((v) => [v.lat, v.lng] as [number, number]),
        { color: "#f59e0b", fillColor: "#fbbf24", fillOpacity: 0.2, weight: 2, dashArray: "6 4" }
      ).addTo(map);
    });
  }, [mapReady, drawingVertices]);

  // --- Draggable vertex markers (edit mode) ---
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    if (!onVertexMove && !onVertexDelete) {
      // No edit handlers — remove any stale markers and bail
      vertexMarkersRef.current.forEach((m) => m.remove());
      vertexMarkersRef.current = [];
      return;
    }

    import("leaflet").then((L) => {
      if (!map) return;

      // Remove previous markers
      vertexMarkersRef.current.forEach((m) => m.remove());
      vertexMarkersRef.current = [];

      const vertexIcon = L.divIcon({
        className: "",
        html: '<div style="width:14px;height:14px;background:#16a34a;border:2.5px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.4);cursor:grab"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      drawingVertices.forEach((v, i) => {
        const marker = L.marker([v.lat, v.lng], {
          icon: vertexIcon,
          draggable: !!onVertexMoveRef.current,
        }).addTo(map);

        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          onVertexMoveRef.current?.(i, { lat: pos.lat, lng: pos.lng });
        });

        // Right-click (desktop) or contextmenu to delete
        marker.on("contextmenu", (e) => {
          // Prevent map context menu
          (e as unknown as Event).stopPropagation?.();
          onVertexDeleteRef.current?.(i);
        });

        vertexMarkersRef.current.push(marker);
      });
    });
  }, [mapReady, drawingVertices, onVertexMove, onVertexDelete]);

  // --- Fly to viewport ---
  useEffect(() => {
    if (!mapReady || !mapRef.current || !viewport) return;
    mapRef.current.flyTo(
      [viewport.center.lat, viewport.center.lng],
      viewport.zoom,
      { duration: 1 }
    );
  }, [mapReady, viewport]);

  // --- Fit bounds to all polygons on first load ---
  const fitAllPolygons = useCallback(() => {
    const map = mapRef.current;
    if (!map || polygons.length === 0) return;
    import("leaflet").then((L) => {
      if (!map) return;
      const allPoints = polygons.flatMap((p) =>
        p.vertices.map((v) => [v.lat, v.lng] as [number, number])
      );
      if (allPoints.length > 0) {
        map.fitBounds(L.latLngBounds(allPoints), { padding: [20, 20], maxZoom: 17 });
      }
    });
  }, [polygons]);

  useEffect(() => {
    if (mapReady) fitAllPolygons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, polygons.length > 0]);

  return (
    <div
      ref={containerRef}
      className={`w-full rounded-lg overflow-hidden ${className}`}
      style={{ minHeight: "400px" }}
    />
  );
}
