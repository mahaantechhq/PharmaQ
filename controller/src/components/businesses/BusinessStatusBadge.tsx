import type { BusinessStatus } from "@/lib/types/database";
import { Badge } from "@/components/ui/Badge";

const CONFIG: Record<BusinessStatus, { label: string; tone: "success" | "warning" | "danger" }> = {
  approved: { label: "Approved", tone: "success" },
  pending: { label: "Pending", tone: "warning" },
  suspended: { label: "Suspended", tone: "danger" },
};

export function BusinessStatusBadge({ status }: { status: BusinessStatus }) {
  const config = CONFIG[status];
  return <Badge tone={config.tone}>{config.label}</Badge>;
}
