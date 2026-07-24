"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Download, Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { bulkImportProducts } from "@/app/(dashboard)/products/actions";

const TEMPLATE_HEADERS = [
  "Name",
  "Category",
  "Composition",
  "Pack_size",
  "HSN_code",
  "GST_rate",
  "Batch_number",
  "Expiry_date",
  "Mrp",
  "Selling_price",
  "Scheme",
  "Discount %",
  "Stock_qty",
];

// Maps a CSV header (any case) to the lowercase/snake_case field name
// bulkImportProducts expects. Entries here have no direct snake_case
// equivalent (or use a different word entirely), so a generic transform
// alone won't produce the right field name.
const HEADER_FIELD_MAP: Record<string, string> = {
  "discount %": "discount_percent",
  "product name": "name",
  "product": "name",
};

function normalizeHeader(header: string): string {
  const key = header.trim().toLowerCase();
  return HEADER_FIELD_MAP[key] ?? key.replace(/\s+/g, "_");
}

function downloadTemplate() {
  const csv = TEMPLATE_HEADERS.join(",") + "\n" +
    "Paracetamol 650mg,Analgesics,Paracetamol 650mg,Strip of 15,3004,5,B-001,01-01-2027,45,40,5+1,2,200\n";
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pharmaq-products-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function BulkUploadClient() {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; restocked: number; skipped: number; errors: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleFile = (file: File) => {
    setFileName(file.name);
    setResult(null);

    const isExcel = /\.xlsx?$/i.test(file.name);
    if (isExcel) {
      file
        .arrayBuffer()
        .then((buffer) => {
          const workbook = XLSX.read(buffer, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const raw = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "", raw: false });
          const normalized = raw.map((row) => {
            const out: Record<string, string> = {};
            for (const [key, value] of Object.entries(row)) out[normalizeHeader(key)] = String(value);
            return out;
          });
          setRows(normalized);
        })
        .catch(() => toast("Failed to parse Excel file", "error"));
      return;
    }

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normalizeHeader,
      complete: (res) => setRows(res.data),
      error: () => toast("Failed to parse CSV", "error"),
    });
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    setLoading(true);
    try {
      const res = await bulkImportProducts(rows as any);
      setResult(res);
      if (res.created > 0 || res.restocked > 0) {
        toast(`Imported ${res.created} new products, added ${res.restocked} batches`, "success");
      }
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Import failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader
          title="1. Download the template"
          description="Fill in your product and batch details following this format."
        />
        <CardBody>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4" /> Download CSV template
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="2. Upload your file" description="CSV or Excel (.xlsx) files." />
        <CardBody>
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-10 text-center hover:border-primary-300"
          >
            <Upload className="h-6 w-6 text-slate-400" />
            <p className="text-sm text-slate-500">
              {fileName ? <span className="font-medium text-slate-700">{fileName}</span> : "Click to browse or drag & drop your CSV or Excel file"}
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>

          {rows.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm text-slate-600">
                {rows.length} row{rows.length !== 1 && "s"} ready to import.
              </p>
              <Button onClick={handleImport} loading={loading}>
                Import {rows.length} products
              </Button>
              {loading && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Importing products, please wait...
                </p>
              )}
            </div>
          )}

          {result && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 rounded-lg bg-success-50 px-3 py-2 text-sm text-success-600">
                <CheckCircle2 className="h-4 w-4" /> {result.created} new products, {result.restocked} batches added
                {result.skipped > 0 && ` (${result.skipped} batches skipped — already exists)`}
              </div>
              {result.errors.map((e, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
                  <AlertCircle className="h-4 w-4" /> {e}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
