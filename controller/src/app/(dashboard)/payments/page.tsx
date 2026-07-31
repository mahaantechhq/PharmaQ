import { Building2, CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { PaymentsManager } from "@/components/payments/PaymentsManager";
import { currentPeriod } from "@/lib/period";
import { formatDate, formatNumber } from "@/lib/format";

export default async function PaymentsPage() {
  const supabase = await createClient();
  const period = currentPeriod();

  const [{ data: businesses }, { data: payments }, { data: feeSetting }] = await Promise.all([
    supabase.from("businesses").select("id, name").order("name"),
    supabase.from("business_subscription_payments").select("*").eq("period", period),
    supabase.from("platform_settings").select("value").eq("key", "subscription_fee").maybeSingle(),
  ]);

  const monthlyFee = Number((feeSetting?.value as { amount?: number } | null)?.amount ?? 0);
  const paymentsByBusiness = new Map((payments ?? []).map((p) => [p.business_id, p]));

  const rows = (businesses ?? []).map((b) => {
    const payment = paymentsByBusiness.get(b.id);
    return {
      businessId: b.id,
      businessName: b.name,
      amount: payment ? Number(payment.amount) : monthlyFee,
      status: (payment?.status ?? "unpaid") as "paid" | "unpaid",
      paidAt: payment?.paid_at ?? null,
    };
  });

  const paidCount = rows.filter((r) => r.status === "paid").length;
  const unpaidCount = rows.length - paidCount;

  return (
    <div>
      <PageHeader
        title="Payments"
        description={`Monthly subscription status for ${formatDate(period, { month: "long", year: "numeric" })}.`}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total businesses" value={formatNumber(rows.length)} icon={Building2} tone="primary" />
        <StatCard label="Total paid" value={formatNumber(paidCount)} icon={CheckCircle2} tone="success" />
        <StatCard label="Total unpaid" value={formatNumber(unpaidCount)} icon={XCircle} tone="danger" />
      </div>

      <Card className="p-5">
        <PaymentsManager rows={rows} monthlyFee={monthlyFee} />
      </Card>
    </div>
  );
}
