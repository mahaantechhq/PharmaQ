import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { OrderStatusChart } from "@/components/dashboard/OrderStatusChart";
import { TopProductsChart } from "@/components/dashboard/TopProductsChart";

export default async function ReportsPage() {
  const supabase = await createClient();

  const [{ data: orders }, { data: businesses }] = await Promise.all([
    supabase.from("supplier_orders").select("status, grand_total, created_at, supplier_business_id"),
    supabase.from("businesses").select("id, name"),
  ]);

  const businessNames = new Map((businesses ?? []).map((b) => [b.id, b.name]));

  // Keyed by "YYYY-MM" so it sorts chronologically; formatted for display
  // only after sorting.
  const salesByMonth = new Map<string, number>();
  const statusCounts: Record<string, number> = {};
  const gmvByBusiness = new Map<string, number>();

  for (const o of orders ?? []) {
    const monthKey = o.created_at.slice(0, 7);
    salesByMonth.set(monthKey, (salesByMonth.get(monthKey) ?? 0) + Number(o.grand_total));

    const label = o.status.charAt(0).toUpperCase() + o.status.slice(1);
    statusCounts[label] = (statusCounts[label] ?? 0) + 1;

    const name = businessNames.get(o.supplier_business_id) ?? "Unknown";
    gmvByBusiness.set(name, (gmvByBusiness.get(name) ?? 0) + Number(o.grand_total));
  }

  const salesData = Array.from(salesByMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, total]) => ({
      date: new Date(`${monthKey}-01`).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      total,
    }));
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  const topBusinesses = Array.from(gmvByBusiness.entries())
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  return (
    <div>
      <PageHeader title="Reports" description="Platform-wide performance across every business." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="GMV trend" />
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
        <CardHeader title="Top businesses by GMV" />
        <CardBody>
          <TopProductsChart data={topBusinesses} />
        </CardBody>
      </Card>
    </div>
  );
}
