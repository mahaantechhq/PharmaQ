import type { ProductStatus } from "@/lib/types/database";
import { Badge } from "@/components/ui/Badge";

const CONFIG: Record<ProductStatus, { label: string; tone: "success" | "slate" | "warning" }> = {
  active: { label: "Active", tone: "success" },
  draft: { label: "Draft", tone: "slate" },
  inactive: { label: "Inactive", tone: "warning" },
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const config = CONFIG[status];
  return <Badge tone={config.tone}>{config.label}</Badge>;
}
