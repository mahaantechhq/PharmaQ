"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { updateOrderStatus } from "@/app/(dashboard)/orders/actions";
import { STATUS_FLOW, STATUS_LABELS } from "@/lib/orders";
import type { SupplierOrderStatus } from "@/lib/types/database";

export function OrderActions({ orderId, status }: { orderId: string; status: SupplierOrderStatus }) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const nextStatuses = STATUS_FLOW[status];

  if (nextStatuses.length === 0) {
    return <p className="text-sm text-slate-400">No further actions available for this order.</p>;
  }

  const handleTransition = async (next: SupplierOrderStatus) => {
    if ((next === "rejected" || next === "cancelled") && !confirm(`Are you sure you want to ${next} this order?`)) return;

    setLoading(next);
    try {
      await updateOrderStatus(orderId, next);
      toast(`Order marked as ${next}`, "success");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update order", "error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {nextStatuses.map((next) => {
        const isNegative = next === "rejected" || next === "cancelled" || next === "returned";
        return (
          <Button
            key={next}
            variant={isNegative ? "outline" : "primary"}
            className={isNegative ? "text-danger-600 hover:bg-danger-50" : undefined}
            loading={loading === next}
            onClick={() => handleTransition(next)}
          >
            {isNegative ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            {STATUS_LABELS[next]}
          </Button>
        );
      })}
    </div>
  );
}
