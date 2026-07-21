"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { BusinessStatusBadge } from "@/components/businesses/BusinessStatusBadge";
import { formatDate } from "@/lib/format";
import type { Business } from "@/lib/types/database";

export function BusinessesExplorer({ businesses }: { businesses: Business[] }) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>(searchParams.get("status") ?? "all");

  const filtered = useMemo(() => {
    return businesses.filter((b) => {
      const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "all" || b.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [businesses, search, status]);

  const columns: ColumnDef<Business, any>[] = [
    {
      accessorKey: "name",
      header: "Business",
      cell: ({ row }) => (
        <Link href={`/businesses/${row.original.id}`} className="font-medium text-slate-800 hover:text-primary-600">
          {row.original.name}
        </Link>
      ),
    },
    { accessorKey: "email", header: "Email", cell: ({ row }) => row.original.email ?? "—" },
    {
      accessorKey: "city",
      header: "Location",
      cell: ({ row }) => [row.original.city, row.original.state].filter(Boolean).join(", ") || "—",
    },
    {
      accessorKey: "created_at",
      header: "Joined",
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <BusinessStatusBadge status={row.original.status} /> },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search businesses..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="suspended">Suspended</option>
        </Select>
      </div>

      <DataTable columns={columns} data={filtered} emptyLabel="No businesses found" pageSize={10} />
    </div>
  );
}
