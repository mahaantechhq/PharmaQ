import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { CouponsManager } from "@/components/marketing/CouponsManager";
import type { Coupon } from "@/lib/types/database";

export default async function CouponsPage() {
  const supabase = await createClient();
  const { data: coupons } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Marketing" description="Coupons and promotional banners for the marketplace." />
      <MarketingNav />
      <Card>
        <CardBody>
          <CouponsManager coupons={(coupons ?? []) as Coupon[]} />
        </CardBody>
      </Card>
    </div>
  );
}
