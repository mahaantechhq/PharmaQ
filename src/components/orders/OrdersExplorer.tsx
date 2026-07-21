"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Search, Check, X } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { updateOrderStatus } from "@/app/(dashboard)/orders/actions";
import { formatCurrency, formatDate } from "@/lib/format";
import type { SupplierOrderStatus } from "@/lib/types/database";

export interface OrderRow {
  id: string;
  orderNumber: string;
  buyerName: string;
  status: SupplierOrderStatus;
  grandTotal: number;
  createdAt: string;
}

export function OrdersExplorer({ orders }: { orders: OrderRow[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.buyerName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "all" || o.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, status]);

  const handleDecision = async (orderId: string, decision: "accepted" | "rejected") => {
    setPendingId(orderId);
    try {
      await updateOrderStatus(orderId, decision);
      toast(decision === "accepted" ? "Order accepted" : "Order rejected", "success");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update order", "error");
    } finally {
      setPendingId(null);
    }
  };

  const columns: ColumnDef<OrderRow, any>[] = [
    {
      accessorKey: "orderNumber",
      header: "Order",
      cell: ({ row }) => (
        <Link href={`/orders/${row.original.id}`} className="font-medium text-slate-800 hover:text-primary-600">
          {row.original.orderNumber}
        </Link>
      ),
    },
    { accessorKey: "buyerName", header: "Buyer" },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    { accessorKey: "grandTotal", header: "Amount", cell: ({ row }) => formatCurrency(row.original.grandTotal) },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      id: "actions",
      header: "",
      cell: ({ row }) =>
        row.original.status === "placed" ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleDecision(row.original.id, "accepted")}
              loading={pendingId === row.original.id}
            >
              <Check className="h-3.5 w-3.5" /> Accept
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDecision(row.original.id, "rejected")}
              loading={pendingId === row.original.id}
            >
              <X className="h-3.5 w-3.5" /> Reject
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search order # or buyer..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
          <option value="all">All statuses</option>
          <option value="placed">Placed</option>
          <option value="accepted">Accepted</option>
          <option value="invoiced">Invoiced</option>
          <option value="packed">Packed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
          <option value="returned">Returned</option>
        </Select>
      </div>

      <DataTable columns={columns} data={filtered} emptyLabel="No orders found" pageSize={10} />
    </div>
  );
}
