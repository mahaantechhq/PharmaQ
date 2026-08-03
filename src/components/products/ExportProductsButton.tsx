"use client";

import { useState } from "react";
import ExcelJS from "exceljs";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ProductRow } from "@/components/products/ProductsExplorer";

// Mirrors the bulk-upload template's column headers (see
// BulkUploadClient.tsx's TEMPLATE_HEADERS) so an exported file's columns
// line up with what a re-import expects.
const COLUMNS: { header: string; key: string; width: number }[] = [
  { header: "Product Name", key: "name", width: 28 },
  { header: "Category", key: "category", width: 16 },
  { header: "Composition", key: "composition", width: 24 },
  { header: "Company", key: "company", width: 18 },
  { header: "Pack Size", key: "packSize", width: 12 },
  { header: "HSN Code", key: "hsnCode", width: 12 },
  { header: "Batch Number", key: "batchNumber", width: 16 },
  { header: "MRP", key: "mrp", width: 10 },
  { header: "GST", key: "gst", width: 8 },
  { header: "Selling Price", key: "sellingPrice", width: 12 },
  { header: "Scheme", key: "scheme", width: 12 },
  { header: "Discount %", key: "discountPercent", width: 10 },
  { header: "Stock Qty", key: "stockQty", width: 10 },
  { header: "Expiry Date", key: "expiryDate", width: 12 },
  { header: "Status", key: "status", width: 10 },
];

// bulkImportProducts' parseExpiryDate only recognizes a 4-digit-year
// DD-MM-YYYY, MM/YYYY, or "Mon-YY" form -- NOT the 2-digit-year D-M-YY
// format formatExpiryDate() uses for on-screen display. Using that here
// would silently break re-importing an unmodified export.
function toReimportableExpiryDate(value: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")}-${get("month")}-${get("year")}`;
}

function toRow(p: ProductRow) {
  return {
    name: p.name,
    category: p.categoryName ?? "",
    composition: p.composition ?? "",
    company: p.brandName ?? "",
    packSize: p.packSize ?? "",
    hsnCode: p.hsnCode ?? "",
    batchNumber: p.batchNumber ?? "",
    mrp: p.mrp ?? "",
    gst: p.gstRate,
    sellingPrice: p.sellingPrice ?? "",
    scheme: p.scheme ?? "",
    discountPercent: p.discountPercent ?? "",
    stockQty: p.stockQty,
    expiryDate: p.expiryDate ? toReimportableExpiryDate(p.expiryDate) : "",
    status: p.status,
  };
}

function todayLabel() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")},${get("month")},${get("year")}`;
}

// Windows/macOS forbid these in filenames -- swap them for a dash so the
// business name can't produce an invalid download name.
function sanitizeFileName(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, "-");
}

export function ExportProductsButton({ products, businessName }: { products: ProductRow[]; businessName: string }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Products");
      sheet.columns = COLUMNS;
      sheet.addRows(products.map(toRow));
      sheet.getRow(1).font = { bold: true };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sanitizeFileName(businessName)} ${todayLabel()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} loading={exporting} disabled={products.length === 0}>
      <Download className="h-4 w-4" /> Export
    </Button>
  );
}
