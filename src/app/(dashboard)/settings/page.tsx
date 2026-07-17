import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BusinessProfileForm } from "@/components/dashboard/BusinessProfileForm";

export default async function SettingsPage() {
  const ctx = await getCurrentBusiness();
  if (!ctx) return null;

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your business profile."
        action={
          <Badge tone={ctx.business.status === "approved" ? "success" : "warning"}>
            {ctx.business.status === "approved" ? "Verified business" : ctx.business.status}
          </Badge>
        }
      />
      <Card>
        <CardHeader title="Business profile" description="This information appears on your storefront and invoices." />
        <CardBody>
          <BusinessProfileForm business={ctx.business} />
        </CardBody>
      </Card>
    </div>
  );
}
