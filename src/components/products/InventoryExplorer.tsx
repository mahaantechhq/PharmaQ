"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { differenceInCalendarDays, format } from "date-fns";
import { Search } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format";

export interface InventoryRow {
  id: string;
  productId: string;
  productName: string;
  batchNumber: string;
  expiryDate: string;
  mrp: number;
  sellingPrice: number;
  stockQty: number;
}

type FilterKey = "all" | "expiring" | "expired" | "healthy";

function daysLeft(expiryDate: string) {
  return differenceInCalendarDays(new Date(expiryDate), new Date());
}

export function InventoryExplorer({ rows }: { rows: InventoryRow[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchesSearch = r.productName.toLowerCase().includes(search.toLowerCase()) || r.batchNumber.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;
      const days = daysLeft(r.expiryDate);
      if (filter === "expiring") return days >= 0 && days <= 30;
      if (filter === "expired") return days < 0;
      if (filter === "healthy") return days > 30;
      return true;
    });
  }, [rows, search, filter]);

  const columns: ColumnDef<InventoryRow, any>[] = [
    {
      accessorKey: "productName",
      header: "Product",
      cell: ({ row }) => (
        <Link href={`/products/${row.original.productId}`} className="font-medium text-slate-800 hover:text-primary-600">
          {row.original.productName}
        </Link>
      ),
    },
    { accessorKey: "batchNumber", header: "Batch No." },
    {
      accessorKey: "expiryDate",
      header: "Expiry",
      cell: ({ row }) => {
        const days = daysLeft(row.original.expiryDate);
        const tone = days < 0 ? "danger" : days <= 30 ? "warning" : "success";
        return (
          <div className="flex items-center gap-2">
            {format(new Date(row.original.expiryDate), "d MMM yyyy")}
            <Badge tone={tone}>{days < 0 ? "Expired" : `${days}d left`}</Badge>
          </div>
        );
      },
    },
    { accessorKey: "mrp", header: "MRP", cell: ({ row }) => formatCurrency(row.original.mrp) },
    { accessorKey: "sellingPrice", header: "Selling price", cell: ({ row }) => formatCurrency(row.original.sellingPrice) },
    {
      accessorKey: "stockQty",
      header: "Stock",
      cell: ({ row }) => (
        <span className={row.original.stockQty === 0 ? "text-danger-500 font-medium" : "font-medium text-slate-700"}>
          {row.original.stockQty}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by product or batch..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filter} onChange={(e) => setFilter(e.target.value as FilterKey)} className="w-48">
          <option value="all">All batches</option>
          <option value="expiring">Expiring within 30 days</option>
          <option value="expired">Expired</option>
          <option value="healthy">Healthy stock</option>
        </Select>
      </div>

      <DataTable columns={columns} data={filtered} emptyLabel="No batches found" pageSize={12} />
    </div>
  );
}
