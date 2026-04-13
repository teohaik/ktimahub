"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface Field {
  id: string;
  name: string;
  fieldNumber: string | null;
  kaek: string;
  officialArea: number;
  calculatedArea: number | null;
  leaseholderName: string | null;
  polygon: { lat: number; lng: number }[] | null;
}

interface Props {
  fields: Field[];
}

// ---------------------------------------------------------------------------
// Pure-canvas satellite map renderer — no Leaflet, no html2canvas.
// Fetches ArcGIS World Imagery tiles directly, draws them on a <canvas>,
// then draws the polygon on top using the exact same Web Mercator projection.
// This guarantees pixel-perfect alignment between imagery and overlay.
// ---------------------------------------------------------------------------

const TILE_SIZE = 256;
const TILE_URL = (z: number, y: number, x: number) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;

/** Web Mercator: lng → fractional tile X */
function lngToTileX(lng: number, zoom: number) {
  return ((lng + 180) / 360) * Math.pow(2, zoom);
}

/** Web Mercator: lat → fractional tile Y */
function latToTileY(lat: number, zoom: number) {
  const rad = (lat * Math.PI) / 180;
  return (
    (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) /
    2 *
    Math.pow(2, zoom)
  );
}

async function renderFieldMap(
  polygon: { lat: number; lng: number }[],
  canvasW: number,
  canvasH: number
): Promise<string> {
  // 1. Bounds + 30% padding
  const lats = polygon.map((v) => v.lat);
  const lngs = polygon.map((v) => v.lng);
  const pad = 0.3;
  const latSpan = Math.max(...lats) - Math.min(...lats) || 0.001;
  const lngSpan = Math.max(...lngs) - Math.min(...lngs) || 0.001;
  const minLat = Math.min(...lats) - latSpan * pad;
  const maxLat = Math.max(...lats) + latSpan * pad;
  const minLng = Math.min(...lngs) - lngSpan * pad;
  const maxLng = Math.max(...lngs) + lngSpan * pad;
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  // 2. Find highest zoom where padded bounds fit inside canvas
  let zoom = 19;
  for (; zoom >= 1; zoom--) {
    const pxW =
      (lngToTileX(maxLng, zoom) - lngToTileX(minLng, zoom)) * TILE_SIZE;
    const pxH =
      (latToTileY(minLat, zoom) - latToTileY(maxLat, zoom)) * TILE_SIZE;
    if (pxW <= canvasW && pxH <= canvasH) break;
  }

  // 3. Centre of canvas in tile-space
  const cTX = lngToTileX(centerLng, zoom);
  const cTY = latToTileY(centerLat, zoom);

  // 4. Top-left corner of canvas in tile-space
  const tlTX = cTX - canvasW / 2 / TILE_SIZE;
  const tlTY = cTY - canvasH / 2 / TILE_SIZE;

  // 5. Which tile indices cover the canvas?
  const startX = Math.floor(tlTX);
  const startY = Math.floor(tlTY);
  const endX = Math.ceil(tlTX + canvasW / TILE_SIZE);
  const endY = Math.ceil(tlTY + canvasH / TILE_SIZE);

  // 6. Canvas + context
  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, canvasW, canvasH); // dark fallback

  // 7. Fetch & draw tiles (all in parallel)
  await Promise.all(
    Array.from({ length: endY - startY + 1 }, (_, dy) =>
      Array.from({ length: endX - startX + 1 }, (_, dx) => {
        const tx = startX + dx;
        const ty = startY + dy;
        const px = Math.round((tx - tlTX) * TILE_SIZE);
        const py = Math.round((ty - tlTY) * TILE_SIZE);
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            ctx.drawImage(img, px, py, TILE_SIZE, TILE_SIZE);
            resolve();
          };
          img.onerror = () => resolve(); // missing tile → transparent
          img.src = TILE_URL(zoom, ty, tx);
        });
      })
    ).flat()
  );

  // 8. Project lat/lng → canvas pixel (same math, so always aligned)
  function project(lat: number, lng: number) {
    return {
      x: (lngToTileX(lng, zoom) - tlTX) * TILE_SIZE,
      y: (latToTileY(lat, zoom) - tlTY) * TILE_SIZE,
    };
  }

  // 9. Draw polygon
  ctx.beginPath();
  const first = project(polygon[0].lat, polygon[0].lng);
  ctx.moveTo(first.x, first.y);
  for (let i = 1; i < polygon.length; i++) {
    const p = project(polygon[i].lat, polygon[i].lng);
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.fillStyle = "rgba(59,130,246,0.25)";
  ctx.fill();
  ctx.strokeStyle = "#1d4ed8";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  return canvas.toDataURL("image/jpeg", 0.88);
}

// ---------------------------------------------------------------------------

export default function FullReportButton({ fields }: Props) {
  const t = useTranslations();
  const [generating, setGenerating] = useState(false);

  async function generate() {
    setGenerating(true);
    try {
      const { default: jsPDF } = await import("jspdf");

      // Load Noto Sans (Greek support)
      async function loadFont(url: string): Promise<string> {
        const buf = await (await fetch(url)).arrayBuffer();
        const bytes = new Uint8Array(buf);
        let bin = "";
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        return btoa(bin);
      }
      const [regularB64, boldB64] = await Promise.all([
        loadFont("/fonts/NotoSans-Regular.ttf"),
        loadFont("/fonts/NotoSans-Bold.ttf"),
      ]);
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      doc.addFileToVFS("NotoSans-Regular.ttf", regularB64);
      doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
      doc.addFileToVFS("NotoSans-Bold.ttf", boldB64);
      doc.addFont("NotoSans-Bold.ttf", "NotoSans", "bold");

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 14;
      const colW = [10, 38, 42, 25, 32, 32, 42];
      const headers = [
        t("fields.fieldId"), t("fields.kaek"), t("fields.name"), t("fields.fieldNumber"),
        t("fields.officialArea"), t("fields.calculatedArea"), t("fields.leaseholder"),
      ];

      function fmt(n: number | null) {
        if (n == null) return "—";
        return n.toLocaleString("el-GR", { maximumFractionDigits: 0 });
      }

      function drawTableHeader(y: number) {
        doc.setFillColor(22, 101, 52);
        doc.rect(margin, y, pageW - margin * 2, 8, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont("NotoSans", "bold");
        let x = margin;
        headers.forEach((h, i) => { doc.text(h, x + 1, y + 5.5); x += colW[i]; });
        return y + 8;
      }

      function drawTableRow(f: Field, seq: number, y: number, shade: boolean) {
        if (shade) { doc.setFillColor(249, 250, 251); doc.rect(margin, y, pageW - margin * 2, 7, "F"); }
        doc.setTextColor(17, 24, 39);
        doc.setFontSize(7.5);
        doc.setFont("NotoSans", "normal");
        const cells = [String(seq), f.kaek, f.name, f.fieldNumber ?? "—", fmt(f.officialArea), fmt(f.calculatedArea), f.leaseholderName ?? "—"];
        let x = margin;
        cells.forEach((c, i) => { doc.text(c, x + 1, y + 4.5); x += colW[i]; });
        doc.setDrawColor(229, 231, 235);
        doc.line(margin, y + 7, pageW - margin, y + 7);
        return y + 7;
      }

      let pageNum = 0;
      function addPageNumber() {
        pageNum++;
        doc.setFontSize(7); doc.setTextColor(156, 163, 175); doc.setFont("NotoSans", "normal");
        doc.text(new Date().toLocaleDateString("el-GR"), margin, pageH - 6);
        doc.text(`Σελίδα ${pageNum}`, pageW - margin - 20, pageH - 6);
      }

      // -- Table pages --
      doc.setFontSize(13); doc.setFont("NotoSans", "bold"); doc.setTextColor(17, 24, 39);
      doc.text("Κατάσταση Αγροτεμαχίων", margin, 20);
      let y = drawTableHeader(26);

      for (let i = 0; i < fields.length; i++) {
        if (y + 7 > pageH - 16) { addPageNumber(); doc.addPage(); y = drawTableHeader(14); }
        y = drawTableRow(fields[i], i + 1, y, i % 2 === 1);
      }
      addPageNumber();

      // -- Per-field map pages (pure canvas, no Leaflet/html2canvas) --
      for (const field of fields) {
        if (!field.polygon || field.polygon.length < 3) continue;

        // Map image is 700×400 px, rendered entirely in a detached <canvas>
        const imgData = await renderFieldMap(field.polygon, 700, 400);

        doc.addPage();
        addPageNumber();
        doc.setFontSize(12); doc.setFont("NotoSans", "bold"); doc.setTextColor(17, 24, 39);
        doc.text(field.name, margin, 16);
        doc.setFontSize(8); doc.setFont("NotoSans", "normal"); doc.setTextColor(107, 114, 128);
        doc.text(
          field.fieldNumber
            ? `ΚΑΕΚ: ${field.kaek}   Αρ. Τεμαχίου: ${field.fieldNumber}`
            : `ΚΑΕΚ: ${field.kaek}`,
          margin, 22
        );
        doc.text(
          `Επίσημο εμβαδόν: ${fmt(field.officialArea)} τ.μ.   Υπολογιζόμενο: ${fmt(field.calculatedArea)} τ.μ.`,
          margin, 27
        );
        const imgW = pageW - margin * 2;
        const imgH = (400 / 700) * imgW;
        doc.addImage(imgData, "JPEG", margin, 32, imgW, Math.min(imgH, pageH - 50));
      }

      doc.save("fields-full-report.pdf");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <button
      onClick={generate}
      disabled={generating}
      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
    >
      {generating ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      )}
      {generating ? "Παράγεται..." : t("fields.reportFull")}
    </button>
  );
}
