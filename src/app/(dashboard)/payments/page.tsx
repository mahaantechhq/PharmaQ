import { IndianRupee, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { PaymentsExplorer, type PaymentRow } from "@/components/payments/PaymentsExplorer";
import { formatCurrency } from "@/lib/format";

export default async function PaymentsPage() {
  const ctx = await getCurrentBusiness();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("supplier_orders")
    .select("id, order_number, status, payment_status, amount_paid, grand_total, created_at, businesses:buyer_business_id(name)")
    .eq("supplier_business_id", ctx.business.id)
    .order("created_at", { ascending: false });

  const rows: PaymentRow[] = (orders ?? []).map((o: any) => ({
    id: o.id,
    orderNumber: o.order_number,
    companyName: o.businesses?.name ?? "Unknown buyer",
    status: o.status,
    paymentStatus: o.payment_status,
    orderValue: Number(o.grand_total),
    amountPaid: Number(o.amount_paid),
    createdAt: o.created_at,
  }));

  // Received = what's actually been paid (full amount if "paid", the
  // entered amount if "partial", nothing if "unpaid"). Pending = whatever's
  // left of the order value on top of that -- excluding rejected/cancelled
  // orders, which were never going to be paid in the first place.
  const totalOrderValue = rows.reduce((sum, r) => sum + r.amountPaid, 0);
  const pendingAmount = rows
    .filter((r) => r.status !== "rejected" && r.status !== "cancelled")
    .reduce((sum, r) => sum + (r.orderValue - r.amountPaid), 0);

  return (
    <div>
      <PageHeader title="Payments" description="Order value and outstanding amounts across everything you've sold." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Total order value" value={formatCurrency(totalOrderValue)} icon={IndianRupee} tone="success" />
        <StatCard label="Pending amount" value={formatCurrency(pendingAmount)} icon={Clock} tone="warning" />
      </div>

      <Card className="p-5">
        <PaymentsExplorer payments={rows} />
      </Card>
    </div>
  );
}
