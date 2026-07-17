import { CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { OrderStatusHistory } from "@/lib/types/database";

export function StatusTimeline({ history }: { history: OrderStatusHistory[] }) {
  const sorted = [...history].sort((a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime());

  if (sorted.length === 0) {
    return <p className="text-sm text-slate-400">No status history yet.</p>;
  }

  return (
    <div className="flex flex-col">
      {sorted.map((h, i) => (
        <div key={h.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            {i < sorted.length - 1 && <div className="w-px flex-1 bg-slate-100" />}
          </div>
          <div className="pb-6">
            <div className="flex items-center gap-2">
              <StatusBadge status={h.status} />
              <span className="text-xs text-slate-400">
                {new Date(h.changed_at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            {h.note && <p className="mt-1 text-sm text-slate-600">{h.note}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
