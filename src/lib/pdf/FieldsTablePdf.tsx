import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

interface FieldRow {
  id: string;
  name: string;
  fieldNumber: string | null;
  kaek: string;
  officialArea: number;
  calculatedArea: number | null;
  leaseholder: { name: string | null } | null;
}

interface Props {
  fields: FieldRow[];
}

const COLS = [
  { label: "Α/Α", key: "seq", flex: 0.8 },
  { label: "ΚΑΕΚ", key: "kaek", flex: 2.5 },
  { label: "Ονομασία", key: "name", flex: 3 },
  { label: "Αρ. Τεμαχίου", key: "fieldNumber", flex: 1.5 },
  { label: "Επίσημο εμβαδόν (τ.μ.)", key: "officialArea", flex: 2.2 },
  { label: "Υπολ. εμβαδόν (τ.μ.)", key: "calculatedArea", flex: 2.2 },
  { label: "Ενοικιαστής", key: "leaseholder", flex: 2.8 },
];

const s = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "NotoSans" },
  title: { fontSize: 14, fontFamily: "NotoSans", fontWeight: "bold", marginBottom: 16 },
  table: { width: "100%" },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#166534",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  headerCell: {
    color: "#fff",
    fontFamily: "NotoSans",
    fontWeight: "bold",
    fontSize: 8,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  rowAlt: { backgroundColor: "#f9fafb" },
  cell: { fontFamily: "NotoSans", color: "#111827", fontSize: 8.5 },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#9ca3af",
    fontFamily: "NotoSans",
  },
});

function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("el-GR", { maximumFractionDigits: 0 });
}

function HeaderRow() {
  return (
    <View style={s.headerRow} fixed>
      {COLS.map((col) => (
        <Text key={col.key} style={[s.headerCell, { flex: col.flex }]}>
          {col.label}
        </Text>
      ))}
    </View>
  );
}

export function FieldsTablePdf({ fields }: Props) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
        <Text style={s.title}>Κατάσταση Αγροτεμαχίων</Text>
        <View style={s.table}>
          <HeaderRow />
          {fields.map((f, i) => (
            <View
              key={f.id}
              style={[s.row, i % 2 === 1 ? s.rowAlt : {}]}
              wrap={false}
            >
              <Text style={[s.cell, { flex: COLS[0].flex }]}>{i + 1}</Text>
              <Text style={[s.cell, { flex: COLS[1].flex }]}>{f.kaek}</Text>
              <Text style={[s.cell, { flex: COLS[2].flex }]}>{f.name}</Text>
              <Text style={[s.cell, { flex: COLS[3].flex }]}>{f.fieldNumber ?? "—"}</Text>
              <Text style={[s.cell, { flex: COLS[4].flex }]}>
                {fmt(f.officialArea)}
              </Text>
              <Text style={[s.cell, { flex: COLS[5].flex }]}>
                {fmt(f.calculatedArea)}
              </Text>
              <Text style={[s.cell, { flex: COLS[6].flex }]}>
                {f.leaseholder?.name ?? "—"}
              </Text>
            </View>
          ))}
        </View>
        <View style={s.footer} fixed>
          <Text>
            Εκτυπώθηκε: {new Date().toLocaleDateString("el-GR")}
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Σελίδα ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
