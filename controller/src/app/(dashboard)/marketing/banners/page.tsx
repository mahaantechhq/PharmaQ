import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { BannersManager } from "@/components/marketing/BannersManager";
import type { Banner } from "@/lib/types/database";

export default async function BannersPage() {
  const supabase = await createClient();
  const { data: banners } = await supabase.from("banners").select("*").order("sort_order", { ascending: true });

  return (
    <div>
      <PageHeader title="Marketing" description="Promotional banners for the marketplace." />
      <MarketingNav />
      <Card>
        <CardBody>
          <BannersManager banners={(banners ?? []) as Banner[]} />
        </CardBody>
      </Card>
    </div>
  );
}
