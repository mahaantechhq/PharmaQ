"use client";

import Papa from "papaparse";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatExpiryDate } from "@/lib/format";
import type { ProductRow } from "@/components/products/ProductsExplorer";

// Mirrors the bulk-upload template's column headers (see
// BulkUploadClient.tsx's TEMPLATE_HEADERS) so an exported file can be
// re-imported unchanged.
function toCsvRow(p: ProductRow) {
  return {
    "Product Name": p.name,
    "Category": p.categoryName ?? "",
    "Composition": p.composition ?? "",
    "Company": p.brandName ?? "",
    "Pack Size": p.packSize ?? "",
    "HSN Code": p.hsnCode ?? "",
    "Batch Number": p.batchNumber ?? "",
    "MRP": p.mrp ?? "",
    "GST": p.gstRate,
    "Selling Price": p.sellingPrice ?? "",
    "Scheme": p.scheme ?? "",
    "Discount %": p.discountPercent ?? "",
    "Stock Qty": p.stockQty,
    "Expiry Date": p.expiryDate ? formatExpiryDate(p.expiryDate) : "",
    "Status": p.status,
  };
}

export function ExportProductsButton({ products }: { products: ProductRow[] }) {
  const handleExport = () => {
    const csv = Papa.unparse(products.map(toCsvRow));
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pharmaq-products-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={products.length === 0}>
      <Download className="h-4 w-4" /> Export
    </Button>
  );
}
