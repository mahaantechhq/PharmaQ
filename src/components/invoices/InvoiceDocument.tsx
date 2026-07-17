import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Invoice, SupplierOrderItem, Business } from "@/lib/types/database";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: "#0f172a", fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  brand: { fontSize: 18, fontWeight: 700, color: "#014baa" },
  title: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  muted: { color: "#64748b" },
  section: { marginBottom: 20 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  col: { flexDirection: "column", gap: 2 },
  table: { marginTop: 12, borderTop: "1px solid #e2e8f0" },
  tableHeader: { flexDirection: "row", backgroundColor: "#f8fafc", padding: 6, fontWeight: 700 },
  tableRow: { flexDirection: "row", padding: 6, borderBottom: "1px solid #f1f5f9" },
  cellProduct: { width: "40%" },
  cellQty: { width: "12%", textAlign: "right" },
  cellPrice: { width: "16%", textAlign: "right" },
  cellGst: { width: "12%", textAlign: "right" },
  cellTotal: { width: "20%", textAlign: "right" },
  totals: { marginTop: 16, alignItems: "flex-end" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", width: 180, marginBottom: 4 },
  grandTotal: { fontWeight: 700, fontSize: 12, borderTop: "1px solid #e2e8f0", paddingTop: 6, marginTop: 4 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", color: "#94a3b8", fontSize: 8 },
});

interface InvoiceDocumentProps {
  invoice: Invoice;
  orderNumber: string;
  items: SupplierOrderItem[];
  supplier: Business;
  buyer: { name: string; address_line1: string | null; city: string | null; state: string | null; gstin: string | null };
}

export function InvoiceDocument({ invoice, orderNumber, items, supplier, buyer }: InvoiceDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Pharma Q</Text>
            <Text style={styles.muted}>B2B Pharma Marketplace</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.title}>Tax Invoice</Text>
            <Text style={styles.muted}>{invoice.invoice_number}</Text>
            <Text style={styles.muted}>{new Date(invoice.invoice_date).toLocaleDateString("en-IN")}</Text>
          </View>
        </View>

        <View style={[styles.section, styles.row]}>
          <View style={styles.col}>
            <Text style={{ fontWeight: 700, marginBottom: 2 }}>Sold by</Text>
            <Text>{supplier.name}</Text>
            {supplier.address_line1 && <Text style={styles.muted}>{supplier.address_line1}</Text>}
            <Text style={styles.muted}>{[supplier.city, supplier.state].filter(Boolean).join(", ")}</Text>
            {supplier.gstin && <Text style={styles.muted}>GSTIN: {supplier.gstin}</Text>}
          </View>
          <View style={styles.col}>
            <Text style={{ fontWeight: 700, marginBottom: 2 }}>Billed to</Text>
            <Text>{buyer.name}</Text>
            {buyer.address_line1 && <Text style={styles.muted}>{buyer.address_line1}</Text>}
            <Text style={styles.muted}>{[buyer.city, buyer.state].filter(Boolean).join(", ")}</Text>
            {buyer.gstin && <Text style={styles.muted}>GSTIN: {buyer.gstin}</Text>}
          </View>
        </View>

        <Text style={styles.muted}>Order Reference: {orderNumber}</Text>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.cellProduct}>Product</Text>
            <Text style={styles.cellQty}>Qty</Text>
            <Text style={styles.cellPrice}>Unit Price</Text>
            <Text style={styles.cellGst}>GST</Text>
            <Text style={styles.cellTotal}>Amount</Text>
          </View>
          {items.map((item) => (
            <View style={styles.tableRow} key={item.id}>
              <Text style={styles.cellProduct}>{item.product_name}</Text>
              <Text style={styles.cellQty}>{item.quantity}</Text>
              <Text style={styles.cellPrice}>Rs {Number(item.unit_price).toFixed(2)}</Text>
              <Text style={styles.cellGst}>{Number(item.gst_rate)}%</Text>
              <Text style={styles.cellTotal}>Rs {Number(item.line_total).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.muted}>Subtotal</Text>
            <Text>Rs {Number(invoice.subtotal).toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.muted}>Tax</Text>
            <Text>Rs {Number(invoice.tax_total).toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text>Grand Total</Text>
            <Text>Rs {Number(invoice.grand_total).toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>Generated by Pharma Q — this is a system-generated invoice.</Text>
      </Page>
    </Document>
  );
}
