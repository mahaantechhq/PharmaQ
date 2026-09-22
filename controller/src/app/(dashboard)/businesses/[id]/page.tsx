import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { BusinessStatusBadge } from "@/components/businesses/BusinessStatusBadge";
import { BusinessTypeBadge } from "@/components/businesses/BusinessTypeBadge";
import { BusinessActions } from "@/components/businesses/BusinessActions";
import { BusinessProfileForm } from "@/components/businesses/BusinessProfileForm";
import { AccessCodeCard } from "@/components/businesses/AccessCodeCard";
import { LinkedRetailersCard, type LinkedRetailer } from "@/components/businesses/LinkedRetailersCard";
import { Package, ShoppingCart, Link2, Wallet } from "lucide-react";
import { formatNumber, formatDate, formatCurrency } from "@/lib/format";
import type { Business, BusinessOwner } from "@/lib/types/database";

export default async function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: business }, { data: owner }, { data: accessCodeRow }] = await Promise.all([
    supabase.from("businesses").select("*").eq("id", id).single(),
    supabase.from("business_owners").select("*").eq("business_id", id).maybeSingle(),
    supabase.from("business_access_codes").select("access_code").eq("business_id", id).maybeSingle(),
  ]);

  if (!business) notFound();
  if (!owner) notFound();

  const b = business as Business;
  const o = owner as BusinessOwner;
  const isRetailer = b.business_type === "retailer";

  const [{ data: links }, wholesalerStats, retailerStats] = await Promise.all([
    supabase
      .from("retailer_wholesaler_links")
      .select("id, retailer:retailer_business_id(id, name, business_access_codes(access_code))")
      .eq("wholesaler_business_id", id),
    isRetailer
      ? Promise.resolve(null)
      : Promise.all([
          supabase.from("products").select("id", { count: "exact", head: true }).eq("business_id", id),
          supabase.from("supplier_orders").select("id", { count: "exact", head: true }).eq("supplier_business_id", id),
        ]),
    isRetailer
      ? Promise.all([
          supabase.from("orders").select("id", { count: "exact", head: true }).eq("buyer_business_id", id),
          supabase.from("retailer_wholesaler_links").select("id", { count: "exact", head: true }).eq("retailer_business_id", id),
          supabase.from("supplier_orders").select("grand_total").eq("buyer_business_id", id),
        ])
      : Promise.resolve(null),
  ]);

  const linkedRetailers: LinkedRetailer[] = (links ?? []).map((l: any) => ({
    linkId: l.id,
    businessId: l.retailer.id,
    name: l.retailer.name,
    accessCode: l.retailer.business_access_codes?.access_code ?? "",
  }));

  const totalSpend = retailerStats ? retailerStats[2].data?.reduce((sum, r) => sum + Number(r.grand_total), 0) ?? 0 : 0;

  return (
    <div>
      <PageHeader
        title={b.name}
        description={`Joined ${formatDate(b.created_at, { day: "2-digit", month: "long", year: "numeric" })}`}
        action={
          <div className="flex items-center gap-3">
            <BusinessTypeBadge businessType={b.business_type} />
            <BusinessStatusBadge status={b.status} />
            <BusinessActions businessId={b.id} status={b.status} />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {isRetailer ? (
          <>
            <StatCard label="Orders placed" value={formatNumber(retailerStats?.[0].count ?? 0)} icon={ShoppingCart} tone="primary" />
            <StatCard label="Linked wholesalers" value={formatNumber(retailerStats?.[1].count ?? 0)} icon={Link2} tone="success" />
            <StatCard label="Total spend" value={formatCurrency(totalSpend)} icon={Wallet} tone="primary" />
          </>
        ) : (
          <>
            <StatCard label="Products listed" value={formatNumber(wholesalerStats?.[0].count ?? 0)} icon={Package} tone="primary" />
            <StatCard label="Orders as supplier" value={formatNumber(wholesalerStats?.[1].count ?? 0)} icon={ShoppingCart} tone="primary" />
            <StatCard label="Linked businesses" value={formatNumber(linkedRetailers.length)} icon={Link2} tone="success" />
          </>
        )}
      </div>

      <Card className="mt-6">
        <CardHeader title="Business profile" />
        <CardBody>
          <BusinessProfileForm business={b} owner={o} />
        </CardBody>
      </Card>

      {b.business_type === "retailer" && <AccessCodeCard code={accessCodeRow?.access_code ?? ""} />}
      {b.business_type === "wholesaler" && <LinkedRetailersCard wholesalerBusinessId={b.id} retailers={linkedRetailers} />}
    </div>
  );
}
