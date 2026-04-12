/**
 * Leaflet's default marker icons break under webpack/Next.js because the
 * image URLs are resolved at build time and the asset hashes change.
 * This module fixes that by explicitly pointing to the CDN copies.
 * Import once at the top of any file that uses Leaflet markers.
 */
import L from "leaflet";

// Only run on client
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}
