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
import { PaymentStatusCell } from "@/components/orders/PaymentStatusCell";
import { formatCurrency, formatDate } from "@/lib/format";
import type { SupplierOrderStatus, PaymentStatus } from "@/lib/types/database";

export interface OrderRow {
  id: string;
  orderNumber: string;
  buyerName: string;
  status: SupplierOrderStatus;
  paymentStatus: PaymentStatus;
  amountPaid: number;
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

  const handleTransition = async (orderId: string, next: SupplierOrderStatus, successMessage: string) => {
    setPendingId(orderId);
    try {
      await updateOrderStatus(orderId, next);
      toast(successMessage, "success");
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
      id: "paymentStatus",
      header: "Payment",
      cell: ({ row }) => (
        <PaymentStatusCell
          orderId={row.original.id}
          grandTotal={row.original.grandTotal}
          initialStatus={row.original.paymentStatus}
          initialAmountPaid={row.original.amountPaid}
        />
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const busy = pendingId === row.original.id;
        if (row.original.status === "placed") {
          return (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleTransition(row.original.id, "accepted", "Order accepted")} loading={busy}>
                <Check className="h-3.5 w-3.5" /> Accept
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleTransition(row.original.id, "rejected", "Order rejected")} loading={busy}>
                <X className="h-3.5 w-3.5" /> Reject
              </Button>
            </div>
          );
        }
        if (row.original.status === "delivered") {
          return (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleTransition(row.original.id, "completed", "Order marked as completed")} loading={busy}>
                <Check className="h-3.5 w-3.5" /> Mark as completed
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleTransition(row.original.id, "returned", "Order marked as returned")} loading={busy}>
                <X className="h-3.5 w-3.5" /> Mark as returned
              </Button>
            </div>
          );
        }
        if (row.original.status === "completed") {
          return (
            <Button variant="danger" size="sm" onClick={() => handleTransition(row.original.id, "returned", "Order marked as returned")} loading={busy}>
              <X className="h-3.5 w-3.5" /> Mark as returned
            </Button>
          );
        }
        return null;
      },
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
