"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { updateBusinessStatus } from "@/app/(dashboard)/businesses/actions";
import type { BusinessStatus } from "@/lib/types/database";

export function BusinessActions({ businessId, status }: { businessId: string; status: BusinessStatus }) {
  const [loading, setLoading] = useState<BusinessStatus | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handle = async (next: BusinessStatus) => {
    if (next === "suspended" && !confirm("Suspend this business? They will lose access immediately.")) return;
    setLoading(next);
    try {
      await updateBusinessStatus(businessId, next);
      toast(`Business marked as ${next}`, "success");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update status", "error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {status === "pending" && (
        <Button loading={loading === "approved"} onClick={() => handle("approved")}>
          <CheckCircle2 className="h-4 w-4" /> Approve
        </Button>
      )}
      {status !== "suspended" && (
        <Button
          variant="outline"
          className="text-danger-600 hover:bg-danger-50"
          loading={loading === "suspended"}
          onClick={() => handle("suspended")}
        >
          <Ban className="h-4 w-4" /> Suspend
        </Button>
      )}
      {status === "suspended" && (
        <Button variant="outline" loading={loading === "approved"} onClick={() => handle("approved")}>
          <RotateCcw className="h-4 w-4" /> Reinstate
        </Button>
      )}
    </div>
  );
}
