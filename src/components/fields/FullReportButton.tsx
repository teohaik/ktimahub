"use client";

import { useState, useRef } from "react";
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

export default function FullReportButton({ fields }: Props) {
  const t = useTranslations();
  const [generating, setGenerating] = useState(false);

  async function generate() {
    setGenerating(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);
      const L = await import("leaflet");

      // Load Noto Sans (supports Greek) and register with jsPDF
      async function loadFont(url: string): Promise<string> {
        const res = await fetch(url);
        const buf = await res.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
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
        headers.forEach((h, i) => {
          doc.text(h, x + 1, y + 5.5);
          x += colW[i];
        });
        return y + 8;
      }

      function drawTableRow(f: Field, seq: number, y: number, shade: boolean) {
        if (shade) {
          doc.setFillColor(249, 250, 251);
          doc.rect(margin, y, pageW - margin * 2, 7, "F");
        }
        doc.setTextColor(17, 24, 39);
        doc.setFontSize(7.5);
        doc.setFont("NotoSans", "normal");
        const cells = [
          String(seq), f.kaek, f.name, f.fieldNumber ?? "—",
          fmt(f.officialArea), fmt(f.calculatedArea),
          f.leaseholderName ?? "—",
        ];
        let x = margin;
        cells.forEach((c, i) => {
          doc.text(c, x + 1, y + 4.5);
          x += colW[i];
        });
        doc.setDrawColor(229, 231, 235);
        doc.line(margin, y + 7, pageW - margin, y + 7);
        return y + 7;
      }

      let pageNum = 0;
      function addPageNumber() {
        pageNum++;
        doc.setFontSize(7);
        doc.setTextColor(156, 163, 175);
        doc.setFont("NotoSans", "normal");
        doc.text(
          `${new Date().toLocaleDateString("el-GR")}`,
          margin,
          pageH - 6
        );
        doc.text(
          `Σελίδα ${pageNum}`,
          pageW - margin - 20,
          pageH - 6
        );
      }

      // -- Page 1+: Table --
      doc.setFontSize(13);
      doc.setFont("NotoSans", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text("Κατάσταση Αγροτεμαχίων", margin, 20);

      let y = drawTableHeader(26);
      let page = 1;

      for (let i = 0; i < fields.length; i++) {
        if (y + 7 > pageH - 16) {
          addPageNumber();
          doc.addPage();
          page++;
          y = drawTableHeader(14);
        }
        y = drawTableRow(fields[i], i + 1, y, i % 2 === 1);
      }
      addPageNumber();

      // -- Per-field map pages --
      // Position at 0,0 (behind everything) so html2canvas captures CSS transforms
      // correctly. Placing it off-screen horizontally (left:-9999px) caused the tile
      // layer and polygon SVG overlay to be captured with a positional offset.
      const mapContainer = document.createElement("div");
      mapContainer.style.cssText =
        "width:700px;height:400px;position:fixed;left:0;top:0;z-index:-9999;pointer-events:none;";
      document.body.appendChild(mapContainer);

      for (const field of fields) {
        if (!field.polygon || field.polygon.length < 3) continue;

        const mapInstance = L.map(mapContainer, { zoomControl: false, attributionControl: false });
        L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        ).addTo(mapInstance);
        const latlngs = field.polygon.map(
          (v) => [v.lat, v.lng] as [number, number]
        );
        const poly = L.polygon(latlngs, {
          color: "#1d4ed8", fillColor: "#3b82f6", fillOpacity: 0.3, weight: 2,
        }).addTo(mapInstance);
        mapInstance.fitBounds(poly.getBounds(), { padding: [30, 30] });

        // Wait for tiles to load
        await new Promise((r) => setTimeout(r, 1500));

        // Force Leaflet to recalculate its pane transforms before capture
        mapInstance.invalidateSize({ animate: false });
        await new Promise((r) => setTimeout(r, 100));

        const canvas = await html2canvas(mapContainer, {
          useCORS: true,
          logging: false,
          scrollX: 0,
          scrollY: 0,
        });
        const imgData = canvas.toDataURL("image/jpeg", 0.85);

        mapInstance.remove();

        doc.addPage();
        addPageNumber();
        doc.setFontSize(12);
        doc.setFont("NotoSans", "bold");
        doc.setTextColor(17, 24, 39);
        doc.text(field.name, margin, 16);
        doc.setFontSize(8);
        doc.setFont("NotoSans", "normal");
        doc.setTextColor(107, 114, 128);
        const kaekLine = field.fieldNumber
          ? `ΚΑΕΚ: ${field.kaek}   Αρ. Τεμαχίου: ${field.fieldNumber}`
          : `ΚΑΕΚ: ${field.kaek}`;
        doc.text(kaekLine, margin, 22);
        doc.text(
          `Επίσημο εμβαδόν: ${fmt(field.officialArea)} τ.μ.   Υπολογιζόμενο: ${fmt(field.calculatedArea)} τ.μ.`,
          margin, 27
        );

        const imgW = pageW - margin * 2;
        const imgH = (canvas.height / canvas.width) * imgW;
        doc.addImage(imgData, "JPEG", margin, 32, imgW, Math.min(imgH, pageH - 50));
      }

      document.body.removeChild(mapContainer);
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
