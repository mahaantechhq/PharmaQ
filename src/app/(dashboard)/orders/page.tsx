import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { OrdersExplorer, type OrderRow } from "@/components/orders/OrdersExplorer";

export default async function OrdersPage() {
  const ctx = await getCurrentBusiness();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("supplier_orders")
    .select("id, order_number, status, payment_status, amount_paid, grand_total, created_at, businesses:buyer_business_id(name)")
    .eq("supplier_business_id", ctx.business.id)
    .order("created_at", { ascending: false });

  const rows: OrderRow[] = (orders ?? []).map((o: any) => ({
    id: o.id,
    orderNumber: o.order_number,
    buyerName: o.businesses?.name ?? "Unknown buyer",
    status: o.status,
    paymentStatus: o.payment_status,
    amountPaid: Number(o.amount_paid),
    grandTotal: Number(o.grand_total),
    createdAt: o.created_at,
  }));

  return (
    <div>
      <PageHeader title="Orders received" description="Orders placed by other businesses buying from your storefront." />
      <Card className="p-5">
        <OrdersExplorer orders={rows} />
      </Card>
    </div>
  );
}
