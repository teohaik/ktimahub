/**
 * SSR-safe wrapper — Leaflet requires browser APIs so we must skip SSR.
 * Import this component instead of LeafletMap directly.
 */
import dynamic from "next/dynamic";
import type { MapComponentProps } from "@/lib/map/types";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full rounded-lg bg-gray-100 animate-pulse flex items-center justify-center text-gray-400 text-sm"
      style={{ minHeight: "400px" }}>
      Φόρτωση χάρτη…
    </div>
  ),
});

export default function DynamicMap(props: MapComponentProps) {
  return <LeafletMap {...props} />;
}
