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
import { Badge } from "@/components/ui/Badge";
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
      id: "orderStatus",
      header: "Order Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const busy = pendingId === row.original.id;
        if (status === "placed") {
          return (
            <div className="flex gap-2">
              <Button size="xs" onClick={() => handleTransition(row.original.id, "accepted", "Order accepted")} loading={busy}>
                <Check className="h-3 w-3" /> Accept
              </Button>
              <Button variant="danger" size="xs" onClick={() => handleTransition(row.original.id, "rejected", "Order rejected")} loading={busy}>
                <X className="h-3 w-3" /> Reject
              </Button>
            </div>
          );
        }
        return <Badge tone={status === "rejected" ? "danger" : "success"}>{status === "rejected" ? "Rejected" : "Accepted"}</Badge>;
      },
    },
    {
      id: "deliveryStatus",
      header: "Delivery Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const busy = pendingId === row.original.id;
        if (["placed", "rejected", "cancelled"].includes(status)) return <span className="text-slate-300">—</span>;
        const isDelivered = ["delivered", "completed", "returned"].includes(status);
        if (isDelivered) return <Badge tone="success">Delivered</Badge>;
        return (
          <Button size="xs" onClick={() => handleTransition(row.original.id, "delivered", "Order marked as delivered")} loading={busy}>
            <Check className="h-3 w-3" /> Deliver
          </Button>
        );
      },
    },
    {
      id: "completionStatus",
      header: "Completion Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const busy = pendingId === row.original.id;
        if (status === "delivered") {
          return (
            <div className="flex gap-2">
              <Button size="xs" onClick={() => handleTransition(row.original.id, "completed", "Order marked as completed")} loading={busy}>
                <Check className="h-3 w-3" /> Complete
              </Button>
              <Button variant="danger" size="xs" onClick={() => handleTransition(row.original.id, "returned", "Order marked as returned")} loading={busy}>
                <X className="h-3 w-3" /> Return
              </Button>
            </div>
          );
        }
        if (status === "completed") {
          return (
            <div className="flex items-center gap-2">
              <Badge tone="success">Completed</Badge>
              <Button variant="danger" size="xs" onClick={() => handleTransition(row.original.id, "returned", "Order marked as returned")} loading={busy}>
                <X className="h-3 w-3" /> Return
              </Button>
            </div>
          );
        }
        if (status === "returned") return <Badge tone="danger">Returned</Badge>;
        return <span className="text-slate-300">—</span>;
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
          <option value="rejected">Rejected</option>
          <option value="delivered">Delivered</option>
          <option value="completed">Completed</option>
          <option value="returned">Returned</option>
        </Select>
      </div>

      <DataTable columns={columns} data={filtered} emptyLabel="No orders found" pageSize={10} />
    </div>
  );
}
