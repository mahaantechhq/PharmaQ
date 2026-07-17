import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { Badge } from "@/components/ui/Badge";

interface ExpiryAlert {
  id: string;
  productName: string;
  batchNumber: string;
  expiryDate: string;
  stockQty: number;
}

export function ExpiryAlertList({ alerts }: { alerts: ExpiryAlert[] }) {
  if (alerts.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">No batches expiring soon.</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-slate-50">
      {alerts.map((a) => {
        const daysLeft = differenceInCalendarDays(new Date(a.expiryDate), new Date());
        return (
          <Link
            key={a.id}
            href="/inventory"
            className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning-50 text-warning-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">{a.productName}</p>
                <p className="truncate text-xs text-slate-400">
                  Batch {a.batchNumber} · {a.stockQty} units · exp {format(new Date(a.expiryDate), "d MMM yyyy")}
                </p>
              </div>
            </div>
            <Badge tone={daysLeft <= 10 ? "danger" : "warning"}>{daysLeft}d left</Badge>
          </Link>
        );
      })}
    </div>
  );
}
