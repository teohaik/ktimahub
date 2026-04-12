import proj4 from "proj4";
import type { LatLng } from "./types";

// EGSA87 Greek Grid — coordinate system used by the Greek Land Registry
proj4.defs(
  "EPSG:2100",
  "+proj=tmerc +lat_0=0 +lon_0=24 +k=0.9996 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=-199.87,74.79,246.62,0,0,0,0 +units=m +no_defs"
);

/**
 * Convert a single EGSA87 (EPSG:2100) coordinate to WGS84 lat/lng.
 * Land registry exports X (Easting) and Y (Northing).
 */
export function egsa87ToWgs84(x: number, y: number): LatLng {
  const [lng, lat] = proj4("EPSG:2100", "EPSG:4326", [x, y]);
  return { lat, lng };
}

/**
 * Parse the tab-separated land registry vertex export format:
 *
 * A/A  X           Y
 * 0    416623.92   4489235.86
 * 1    416637.22   4489226.52
 * ...
 *
 * Returns vertices in WGS84 for use on the map.
 * Throws if the format is unrecognisable.
 */
export function parseLandRegistryCoordinates(raw: string): LatLng[] {
  const lines = raw
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const vertices: LatLng[] = [];

  for (const line of lines) {
    // Skip header line
    if (/^a\/a/i.test(line)) continue;

    const parts = line.split(/\s+/);
    if (parts.length < 3) continue;

    // parts[0] = index, parts[1] = X (Easting), parts[2] = Y (Northing)
    const x = parseFloat(parts[1]);
    const y = parseFloat(parts[2]);

    if (isNaN(x) || isNaN(y)) continue;

    vertices.push(egsa87ToWgs84(x, y));
  }

  if (vertices.length < 3) {
    throw new Error(
      "Could not parse coordinates. Expected at least 3 valid rows."
    );
  }

  return vertices;
}

/**
 * Calculate polygon area in m² using the Shoelace formula on WGS84 coordinates.
 * Accurate enough for agricultural field sizes in Greece.
 */
export function calculatePolygonArea(vertices: LatLng[]): number {
  if (vertices.length < 3) return 0;

  // Convert to metres using a simple equirectangular approximation
  // centred on the polygon — accurate within ~0.1% for Greece-sized polygons
  const centLat =
    vertices.reduce((s, v) => s + v.lat, 0) / vertices.length;
  const metersPerDegLat = 111320;
  const metersPerDegLng = 111320 * Math.cos((centLat * Math.PI) / 180);

  const pts = vertices.map((v) => ({
    x: v.lng * metersPerDegLng,
    y: v.lat * metersPerDegLat,
  }));

  let area = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += pts[i].x * pts[j].y;
    area -= pts[j].x * pts[i].y;
  }

  return Math.abs(area / 2);
}
