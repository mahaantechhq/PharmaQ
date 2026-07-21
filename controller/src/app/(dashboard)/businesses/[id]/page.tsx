import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { BusinessStatusBadge } from "@/components/businesses/BusinessStatusBadge";
import { BusinessActions } from "@/components/businesses/BusinessActions";
import { BusinessProfileForm } from "@/components/businesses/BusinessProfileForm";
import { Package, ShoppingCart, Wallet } from "lucide-react";
import { formatCurrency, formatNumber, formatDate } from "@/lib/format";
import type { Business } from "@/lib/types/database";

export default async function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: business }, { count: productCount }, { count: orderCount }, { data: wallet }] = await Promise.all([
    supabase.from("businesses").select("*").eq("id", id).single(),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("business_id", id),
    supabase.from("supplier_orders").select("id", { count: "exact", head: true }).eq("supplier_business_id", id),
    supabase.from("wallets").select("*").eq("business_id", id).maybeSingle(),
  ]);

  if (!business) notFound();

  const b = business as Business;

  return (
    <div>
      <PageHeader
        title={b.name}
        description={`Joined ${formatDate(b.created_at, { day: "2-digit", month: "long", year: "numeric" })}`}
        action={
          <div className="flex items-center gap-3">
            <BusinessStatusBadge status={b.status} />
            <BusinessActions businessId={b.id} status={b.status} />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Products listed" value={formatNumber(productCount ?? 0)} icon={Package} tone="primary" />
        <StatCard label="Orders as supplier" value={formatNumber(orderCount ?? 0)} icon={ShoppingCart} tone="primary" />
        <StatCard label="Wallet balance" value={formatCurrency(Number(wallet?.balance ?? 0))} icon={Wallet} tone="success" />
      </div>

      <Card className="mt-6">
        <CardHeader title="Business profile" />
        <CardBody>
          <BusinessProfileForm business={b} />
        </CardBody>
      </Card>
    </div>
  );
}
