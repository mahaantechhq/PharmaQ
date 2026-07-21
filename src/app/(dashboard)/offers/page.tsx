import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { OffersManager } from "@/components/offers/OffersManager";
import type { Offer } from "@/lib/types/database";

export default async function OffersPage() {
  const ctx = await getCurrentBusiness();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data: offers } = await supabase
    .from("offers")
    .select("*")
    .eq("business_id", ctx.business.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Offers" description="Discounts you're running on your own products, shown to buyers across the marketplace." />
      <Card>
        <CardBody>
          <OffersManager offers={(offers ?? []) as Offer[]} />
        </CardBody>
      </Card>
    </div>
  );
}
