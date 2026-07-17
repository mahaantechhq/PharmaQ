import { requireCurrentBusiness } from "@/lib/supabase/require-business";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BusinessProfileForm } from "@/components/profile/BusinessProfileForm";

export default async function ProfilePage() {
  const ctx = await requireCurrentBusiness("/profile");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Business profile</h1>
        <Badge tone={ctx.business.status === "approved" ? "success" : "warning"}>
          {ctx.business.status === "approved" ? "Verified business" : ctx.business.status}
        </Badge>
      </div>
      <Card>
        <CardHeader title="Business details" description="This information appears on your storefront and orders." />
        <CardBody>
          <BusinessProfileForm business={ctx.business} />
        </CardBody>
      </Card>
    </div>
  );
}
