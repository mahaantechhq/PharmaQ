import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { OrderStatusChart } from "@/components/dashboard/OrderStatusChart";
import { TopProductsChart } from "@/components/dashboard/TopProductsChart";

export default async function ReportsPage() {
  const ctx = await getCurrentBusiness();
  if (!ctx) return null;

  const supabase = await createClient();

  const [{ data: orders }, { data: items }] = await Promise.all([
    supabase
      .from("supplier_orders")
      .select("status, grand_total, created_at")
      .eq("supplier_business_id", ctx.business.id),
    supabase
      .from("supplier_order_items")
      .select("product_name, line_total, supplier_orders!inner(supplier_business_id)")
      .eq("supplier_orders.supplier_business_id", ctx.business.id),
  ]);

  const salesByMonth = new Map<string, number>();
  const statusCounts: Record<string, number> = {};
  for (const o of orders ?? []) {
    const month = new Date(o.created_at).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    salesByMonth.set(month, (salesByMonth.get(month) ?? 0) + Number(o.grand_total));
    const label = o.status.charAt(0).toUpperCase() + o.status.slice(1);
    statusCounts[label] = (statusCounts[label] ?? 0) + 1;
  }
  const salesData = Array.from(salesByMonth.entries()).map(([date, total]) => ({ date, total }));
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const revenueByProduct = new Map<string, number>();
  for (const item of items ?? []) {
    revenueByProduct.set(item.product_name, (revenueByProduct.get(item.product_name) ?? 0) + Number(item.line_total));
  }
  const topProducts = Array.from(revenueByProduct.entries())
    .map(([name, revenue]) => ({ name, revenue }))
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

      <Card className="mt-6">
        <CardHeader title="Top products by revenue" />
        <CardBody>
          <TopProductsChart data={topProducts} />
        </CardBody>
      </Card>
    </div>
  );
}
