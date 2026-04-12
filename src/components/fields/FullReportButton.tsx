"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";

interface Field {
  id: string;
  name: string;
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

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 14;
      const colW = [10, 40, 45, 35, 35, 45];
      const headers = [
        t("fields.fieldId"), t("fields.kaek"), t("fields.name"),
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
        doc.setFont("helvetica", "bold");
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
        doc.setFont("helvetica", "normal");
        const cells = [
          String(seq), f.kaek, f.name,
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

      function addPageNumber() {
        doc.setFontSize(7);
        doc.setTextColor(156, 163, 175);
        doc.setFont("helvetica", "normal");
        doc.text(
          `${new Date().toLocaleDateString("el-GR")}`,
          margin,
          pageH - 6
        );
        doc.text(
          `Σελίδα ${doc.getCurrentPageInfo().pageNumber}`,
          pageW - margin - 20,
          pageH - 6
        );
      }

      // -- Page 1+: Table --
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
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
      const mapContainer = document.createElement("div");
      mapContainer.style.cssText =
        "width:700px;height:400px;position:fixed;left:-9999px;top:0;z-index:-1;";
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

        // Wait for tiles
        await new Promise((r) => setTimeout(r, 1200));

        const canvas = await html2canvas(mapContainer, { useCORS: true, logging: false });
        const imgData = canvas.toDataURL("image/jpeg", 0.85);

        mapInstance.remove();

        doc.addPage();
        addPageNumber();
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(17, 24, 39);
        doc.text(field.name, margin, 16);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(107, 114, 128);
        doc.text(`ΚΑΕΚ: ${field.kaek}`, margin, 22);
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
