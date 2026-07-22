"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { SupplierOrderStatus, PaymentStatus } from "@/lib/types/database";

const PAYMENT_TONE: Record<PaymentStatus, "success" | "warning" | "danger"> = {
  paid: "success",
  partial: "warning",
  unpaid: "danger",
};

export interface PaymentRow {
  id: string;
  orderNumber: string;
  companyName: string;
  status: SupplierOrderStatus;
  paymentStatus: PaymentStatus;
  orderValue: number;
  amountPaid: number;
  createdAt: string;
}

export function PaymentsExplorer({ payments }: { payments: PaymentRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return payments.filter(
      (p) =>
        p.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        p.companyName.toLowerCase().includes(search.toLowerCase()),
    );
  }, [payments, search]);

  const columns: ColumnDef<PaymentRow, any>[] = [
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      accessorKey: "orderNumber",
      header: "Order Number",
      cell: ({ row }) => (
        <Link href={`/orders/${row.original.id}`} className="font-medium text-slate-800 hover:text-primary-600">
          {row.original.orderNumber}
        </Link>
      ),
    },
    { accessorKey: "companyName", header: "Company" },
    {
      accessorKey: "orderValue",
      header: "Order Value",
      cell: ({ row }) => formatCurrency(row.original.orderValue),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <Badge tone={PAYMENT_TONE[row.original.paymentStatus]}>
            {row.original.paymentStatus.charAt(0).toUpperCase() + row.original.paymentStatus.slice(1)}
          </Badge>
          {row.original.paymentStatus === "partial" && (
            <span className="text-xs text-slate-400">{formatCurrency(row.original.amountPaid)} paid</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search order # or company..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable columns={columns} data={filtered} emptyLabel="No orders yet." pageSize={10} />
    </div>
  );
}
