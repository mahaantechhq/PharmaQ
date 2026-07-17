"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreVertical, Pencil, Search, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ProductStatusBadge } from "@/components/products/ProductStatusBadge";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import { deleteProduct } from "@/app/(dashboard)/products/actions";
import type { ProductStatus } from "@/lib/types/database";

export interface ProductRow {
  id: string;
  name: string;
  categoryName: string | null;
  brandName: string | null;
  packSize: string | null;
  status: ProductStatus;
  totalStock: number;
  minPrice: number | null;
}

export function ProductsExplorer({ products }: { products: ProductRow[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const router = useRouter();
  const { toast } = useToast();

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "all" || p.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [products, search, status]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    try {
      await deleteProduct(id);
      toast("Product deleted", "success");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete", "error");
    }
  };

  const columns: ColumnDef<ProductRow, any>[] = [
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
    { accessorKey: "packSize", header: "Pack size", cell: ({ row }) => row.original.packSize ?? "—" },
    {
      accessorKey: "totalStock",
      header: "Stock",
      cell: ({ row }) => (
        <span className={row.original.totalStock === 0 ? "text-danger-500 font-medium" : ""}>
          {row.original.totalStock}
        </span>
      ),
    },
    {
      accessorKey: "minPrice",
      header: "Price from",
      cell: ({ row }) => (row.original.minPrice != null ? formatCurrency(row.original.minPrice) : "—"),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <ProductStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Dropdown
          trigger={
            <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <MoreVertical className="h-4 w-4" />
            </button>
          }
        >
          {(close) => (
            <>
              <DropdownItem onClick={() => { close(); router.push(`/products/${row.original.id}`); }}>
                <Pencil className="h-4 w-4" /> Edit
              </DropdownItem>
              <DropdownItem
                onClick={() => { close(); handleDelete(row.original.id); }}
                className="text-danger-600 hover:bg-danger-50"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownItem>
            </>
          )}
        </Dropdown>
      ),
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

      <DataTable columns={columns} data={filtered} emptyLabel="No products found" pageSize={10} />
    </div>
  );
}
