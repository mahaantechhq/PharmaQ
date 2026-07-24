import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { OrderStatusChart } from "@/components/dashboard/OrderStatusChart";
import { TopProductsChart } from "@/components/dashboard/TopProductsChart";
import { TopBuyersChart } from "@/components/dashboard/TopBuyersChart";
import { formatDate } from "@/lib/format";

export default async function ReportsPage() {
  const ctx = await getCurrentBusiness();
  if (!ctx) return null;

  const supabase = await createClient();

  const [{ data: orders }, { data: items }, { data: buyers }] = await Promise.all([
    supabase
      .from("supplier_orders")
      .select("status, grand_total, created_at")
      .eq("supplier_business_id", ctx.business.id),
    supabase
      .from("supplier_order_items")
      .select("product_name, line_total, supplier_orders!inner(supplier_business_id)")
      .eq("supplier_orders.supplier_business_id", ctx.business.id),
    supabase
      .from("business_customers")
      .select("buyer_name, total_spent")
      .eq("supplier_business_id", ctx.business.id),
  ]);

  // Keyed by "YYYY-MM" so it sorts chronologically regardless of the order
  // rows came back in; formatted for display only after sorting.
  const salesByMonth = new Map<string, number>();
  const statusCounts: Record<string, number> = {};
  for (const o of orders ?? []) {
    const monthKey = new Date(o.created_at).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }).slice(0, 7);
    salesByMonth.set(monthKey, (salesByMonth.get(monthKey) ?? 0) + Number(o.grand_total));
    const label = o.status.charAt(0).toUpperCase() + o.status.slice(1);
    statusCounts[label] = (statusCounts[label] ?? 0) + 1;
  }
  const salesData = Array.from(salesByMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, total]) => ({
      date: formatDate(`${monthKey}-01`, { month: "short", year: "2-digit" }),
      total,
    }));
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const revenueByProduct = new Map<string, number>();
  for (const item of items ?? []) {
    revenueByProduct.set(item.product_name, (revenueByProduct.get(item.product_name) ?? 0) + Number(item.line_total));
  }
  const topProducts = Array.from(revenueByProduct.entries())
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  const topBuyers = (buyers ?? [])
    .map((b) => ({ name: b.buyer_name, revenue: Number(b.total_spent) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  return (
    <div>
      <PageHeader title="Reports" description="Sales performance and product insights for your business." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Sales by month" />
          <CardBody>
            <SalesChart data={salesData} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Order status breakdown" />
          <CardBody>
            <OrderStatusChart data={statusData} />
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Top products by revenue" />
          <CardBody>
            <TopProductsChart data={topProducts} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Top buyers" description="Businesses that buy the most from you" />
          <CardBody>
            <TopBuyersChart data={topBuyers} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
