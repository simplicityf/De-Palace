import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { formatNaira } from "@/lib/currency";

const COLORS = {
  green: "#3a6200",
  gold: "#c9a227",
  charcoal: "#1a1a12",
  border: "#e2e2d8",
  zebra: "#f7f7ef",
  muted: "#6b6b60",
};

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: COLORS.charcoal },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: COLORS.green,
    paddingBottom: 12,
    marginBottom: 16,
  },
  brand: { fontSize: 18, fontWeight: 700, color: COLORS.green },
  brandSub: { fontSize: 8, color: COLORS.gold, letterSpacing: 1, marginTop: 2 },
  metaLabel: { fontSize: 8, color: COLORS.muted, textAlign: "right" },
  metaValue: { fontSize: 10, textAlign: "right", marginBottom: 4 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.green,
    marginTop: 20,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  table: { borderWidth: 1, borderColor: COLORS.border },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: COLORS.green,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: { fontSize: 8, fontWeight: 700, color: "#ffffff", textTransform: "uppercase" },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  tableRowAlt: { backgroundColor: COLORS.zebra },
  cell: { fontSize: 9 },
  colItem: { flexBasis: "40%" },
  colQty: { flexBasis: "15%", textAlign: "right" },
  colPrice: { flexBasis: "20%", textAlign: "right" },
  colTotal: { flexBasis: "25%", textAlign: "right" },
  stockColItem: { flexBasis: "45%" },
  stockColCategory: { flexBasis: "35%" },
  stockColQty: { flexBasis: "20%", textAlign: "right" },
  totalsBox: {
    marginTop: 12,
    alignSelf: "flex-end",
    width: "60%",
    borderWidth: 1,
    borderColor: COLORS.green,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: COLORS.green,
  },
  totalsLabel: { fontSize: 11, fontWeight: 700, color: "#ffffff", textTransform: "uppercase" },
  totalsValue: { fontSize: 13, fontWeight: 700, color: "#ffffff" },
  emptyNote: { fontSize: 9, color: COLORS.muted, fontStyle: "italic", padding: 8 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    fontSize: 7,
    color: COLORS.muted,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
  },
});

export type ShiftReportData = {
  assistantName: string;
  startedAt: Date;
  endedAt: Date;
  totalSalesAmount: number;
  sales: {
    itemName: string;
    quantitySold: number;
    unitPrice: number;
    totalAmount: number;
  }[];
  remainingStock: { itemName: string; categoryName: string; quantity: number }[];
};

function ShiftReportDocument({ data }: { data: ShiftReportData }) {
  const itemsSold = data.sales.reduce((sum, sale) => sum + sale.quantitySold, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brand}>DePalace</Text>
            <Text style={styles.brandSub}>ILÉ ÉMU · SHIFT STATEMENT</Text>
          </View>
          <View>
            <Text style={styles.metaLabel}>Sales assistant</Text>
            <Text style={styles.metaValue}>{data.assistantName}</Text>
            <Text style={styles.metaLabel}>Shift period</Text>
            <Text style={styles.metaValue}>
              {data.startedAt.toLocaleString()} – {data.endedAt.toLocaleString()}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Sales</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, styles.colItem]}>Item</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>Unit price</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
          </View>
          {data.sales.map((sale, index) => (
            <View
              style={[styles.tableRow, ...(index % 2 === 1 ? [styles.tableRowAlt] : [])]}
              key={index}
            >
              <Text style={[styles.cell, styles.colItem]}>{sale.itemName}</Text>
              <Text style={[styles.cell, styles.colQty]}>{sale.quantitySold}</Text>
              <Text style={[styles.cell, styles.colPrice]}>
                {formatNaira(sale.unitPrice)}
              </Text>
              <Text style={[styles.cell, styles.colTotal]}>
                {formatNaira(sale.totalAmount)}
              </Text>
            </View>
          ))}
          {data.sales.length === 0 && (
            <Text style={styles.emptyNote}>No sales recorded this shift.</Text>
          )}
        </View>

        <View style={styles.totalsBox}>
          <View style={[styles.totalsRow, { backgroundColor: COLORS.charcoal }]}>
            <Text style={styles.totalsLabel}>Items sold</Text>
            <Text style={styles.totalsValue}>{itemsSold}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Overall total</Text>
            <Text style={styles.totalsValue}>{formatNaira(data.totalSalesAmount)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Stock remaining</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, styles.stockColItem]}>Item</Text>
            <Text style={[styles.tableHeaderCell, styles.stockColCategory]}>Category</Text>
            <Text style={[styles.tableHeaderCell, styles.stockColQty]}>Qty left</Text>
          </View>
          {data.remainingStock.map((item, index) => (
            <View
              style={[styles.tableRow, ...(index % 2 === 1 ? [styles.tableRowAlt] : [])]}
              key={index}
            >
              <Text style={[styles.cell, styles.stockColItem]}>{item.itemName}</Text>
              <Text style={[styles.cell, styles.stockColCategory]}>{item.categoryName}</Text>
              <Text style={[styles.cell, styles.stockColQty]}>{item.quantity}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Generated automatically by DePalace on {new Date().toLocaleString()}. This
          statement is emailed to the admin and the sales assistant for their records.
        </Text>
      </Page>
    </Document>
  );
}

export async function renderShiftReportPdf(data: ShiftReportData) {
  return renderToBuffer(<ShiftReportDocument data={data} />);
}
