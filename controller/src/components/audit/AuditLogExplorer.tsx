"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import type { AuditLog } from "@/lib/types/database";

export function AuditLogExplorer({ logs }: { logs: AuditLog[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.entity_type.toLowerCase().includes(search.toLowerCase()),
    );
  }, [logs, search]);

  return (
    <div>
      <div className="relative mb-4 w-full max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input placeholder="Search action or entity..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">No audit entries found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-3 py-2.5">Action</th>
                <th className="px-3 py-2.5">Entity</th>
                <th className="px-3 py-2.5">Details</th>
                <th className="px-3 py-2.5">When</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-3 py-3">
                    <Badge tone="primary">{log.action}</Badge>
                  </td>
                  <td className="px-3 py-3 text-slate-500">
                    {log.entity_type}
                    {log.entity_id && <span className="text-slate-300"> · {log.entity_id.slice(0, 8)}</span>}
                  </td>
                  <td className="max-w-xs truncate px-3 py-3 text-xs text-slate-400">
                    {log.metadata ? JSON.stringify(log.metadata) : "—"}
                  </td>
                  <td className="px-3 py-3 text-slate-500">
                    {new Date(log.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
