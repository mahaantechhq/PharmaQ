import type { BusinessRole } from "@/lib/types/database";
import { Badge } from "@/components/ui/Badge";

const CONFIG: Record<BusinessRole, { label: string; tone: "primary" | "slate" }> = {
  wholesaler: { label: "Wholesaler", tone: "primary" },
  retailer: { label: "Retailer", tone: "slate" },
};

export function BusinessTypeBadge({ businessType }: { businessType: BusinessRole | null }) {
  if (!businessType) return <Badge tone="slate">Unclassified</Badge>;
  const config = CONFIG[businessType];
  return <Badge tone={config.tone}>{config.label}</Badge>;
}
