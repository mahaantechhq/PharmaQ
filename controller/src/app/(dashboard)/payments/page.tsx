import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { PaymentsManager } from "@/components/payments/PaymentsManager";
import { currentPeriod } from "@/lib/period";
import { formatDate } from "@/lib/format";

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

  return (
    <div>
      <PageHeader
        title="Payments"
        description={`Monthly subscription status for ${formatDate(period, { month: "long", year: "numeric" })}.`}
      />
      <Card className="p-5">
        <PaymentsManager rows={rows} monthlyFee={monthlyFee} />
      </Card>
    </div>
  );
}
