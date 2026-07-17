import type { SupplierOrderStatus } from "@/lib/types/database";
import { Badge } from "@/components/ui/Badge";

const STATUS_CONFIG: Record<SupplierOrderStatus, { label: string; tone: "slate" | "primary" | "success" | "warning" | "danger" | "info" }> = {
  placed: { label: "Placed", tone: "info" },
  accepted: { label: "Accepted", tone: "primary" },
  rejected: { label: "Rejected", tone: "danger" },
  invoiced: { label: "Invoiced", tone: "primary" },
  packed: { label: "Packed", tone: "warning" },
  shipped: { label: "Shipped", tone: "warning" },
  delivered: { label: "Delivered", tone: "success" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "slate" },
  returned: { label: "Returned", tone: "danger" },
};

export function StatusBadge({ status }: { status: SupplierOrderStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge tone={config.tone}>{config.label}</Badge>;
}
