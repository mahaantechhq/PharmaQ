"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Search, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ProductStatusBadge } from "@/components/products/ProductStatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import { bulkDeleteProducts, bulkUpdateProductStatus } from "@/app/(dashboard)/products/actions";
import type { ProductStatus } from "@/lib/types/database";

export interface ProductRow {
  id: string;
  name: string;
  categoryName: string | null;
  brandName: string | null;
  composition: string | null;
  packSize: string | null;
  hsnCode: string | null;
  gstRate: number;
  status: ProductStatus;
  batchNumber: string | null;
  expiryDate: string | null;
  mrp: number | null;
  sellingPrice: number | null;
  scheme: string | null;
  discountPercent: number | null;
  stockQty: number;
}

export function ProductsExplorer({ products }: { products: ProductRow[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "all" || p.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [products, search, status]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  const toggleAll = () => {
    setSelected((prev) => {
      if (allFilteredSelected) return new Set();
      const next = new Set(prev);
      filtered.forEach((p) => next.add(p.id));
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} product${selected.size !== 1 ? "s" : ""}? This cannot be undone.`)) return;
    setBulkLoading(true);
    try {
      await bulkDeleteProducts(Array.from(selected));
      toast(`${selected.size} product${selected.size !== 1 ? "s" : ""} deleted`, "success");
      setSelected(new Set());
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkStatus = async (newStatus: ProductStatus) => {
    setBulkLoading(true);
    try {
      await bulkUpdateProductStatus(Array.from(selected), newStatus);
      toast(`${selected.size} product${selected.size !== 1 ? "s" : ""} updated`, "success");
      setSelected(new Set());
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  const columns: ColumnDef<ProductRow, any>[] = [
    {
      id: "select",
      header: () => (
        <input
          type="checkbox"
          checked={allFilteredSelected}
          onChange={toggleAll}
          className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-300"
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selected.has(row.original.id)}
          onChange={() => toggleOne(row.original.id)}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-300"
          aria-label={`Select ${row.original.name}`}
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: "Product",
      cell: ({ row }) => (
        <Link href={`/products/${row.original.id}`} className="font-medium text-slate-800 hover:text-primary-600">
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "categoryName",
      header: "Category",
      cell: ({ row }) => row.original.categoryName ?? <span className="text-slate-300">—</span>,
    },
    {
      accessorKey: "brandName",
      header: "Brand",
      cell: ({ row }) => row.original.brandName ?? <span className="text-slate-300">—</span>,
    },
    {
      accessorKey: "composition",
      header: "Composition",
      cell: ({ row }) => row.original.composition ?? <span className="text-slate-300">—</span>,
    },
    { accessorKey: "packSize", header: "Pack size", cell: ({ row }) => row.original.packSize ?? "—" },
    {
      accessorKey: "hsnCode",
      header: "HSN code",
      cell: ({ row }) => row.original.hsnCode ?? <span className="text-slate-300">—</span>,
    },
    { accessorKey: "gstRate", header: "GST %", cell: ({ row }) => `${row.original.gstRate}%` },
    {
      accessorKey: "batchNumber",
      header: "Batch no.",
      cell: ({ row }) => row.original.batchNumber ?? <span className="text-slate-300">—</span>,
    },
    {
      accessorKey: "expiryDate",
      header: "Expiry",
      cell: ({ row }) => (row.original.expiryDate ? formatDate(row.original.expiryDate) : <span className="text-slate-300">—</span>),
    },
    {
      accessorKey: "mrp",
      header: "MRP",
      cell: ({ row }) => (row.original.mrp != null ? formatCurrency(row.original.mrp) : "—"),
    },
    {
      accessorKey: "sellingPrice",
      header: "Selling price",
      cell: ({ row }) => (row.original.sellingPrice != null ? formatCurrency(row.original.sellingPrice) : "—"),
    },
    {
      accessorKey: "scheme",
      header: "Scheme",
      cell: ({ row }) => row.original.scheme ?? <span className="text-slate-300">—</span>,
    },
    {
      accessorKey: "discountPercent",
      header: "Discount %",
      cell: ({ row }) => (row.original.discountPercent != null ? `${row.original.discountPercent}%` : <span className="text-slate-300">—</span>),
    },
    {
      accessorKey: "stockQty",
      header: "Stock",
      cell: ({ row }) => (
        <span className={row.original.stockQty === 0 ? "text-danger-500 font-medium" : ""}>
          {row.original.stockQty}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <ProductStatusBadge status={row.original.status} />,
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search products..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-primary-50 px-4 py-2.5">
          <span className="text-sm font-medium text-primary-700">{selected.size} selected</span>
          <Select
            value=""
            onChange={(e) => e.target.value && handleBulkStatus(e.target.value as ProductStatus)}
            className="w-44"
            disabled={bulkLoading}
          >
            <option value="">Set status...</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
          </Select>
          <Button variant="danger" size="sm" onClick={handleBulkDelete} loading={bulkLoading}>
            <Trash2 className="h-4 w-4" /> Delete selected
          </Button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-primary-600 hover:underline">
            Clear selection
          </button>
        </div>
      )}

      <DataTable columns={columns} data={filtered} emptyLabel="No products found" pageSize={10} />
    </div>
  );
}
