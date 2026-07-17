import Link from "next/link";
import { Building2, IndianRupee, ShoppingCart, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { OrderStatusChart } from "@/components/dashboard/OrderStatusChart";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { Business, SupplierOrder } from "@/lib/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: businesses }, { data: orders }] = await Promise.all([
    supabase.from("businesses").select("*").order("created_at", { ascending: false }),
    supabase
      .from("supplier_orders")
      .select("*, supplier:supplier_business_id(name), buyer:buyer_business_id(name)")
      .order("created_at", { ascending: false }),
  ]);

  const allBusinesses = (businesses ?? []) as Business[];
  const allOrders = (orders ?? []) as (SupplierOrder & { supplier: { name: string } | null; buyer: { name: string } | null })[];

  const pendingCount = allBusinesses.filter((b) => b.status === "pending").length;
  const approvedCount = allBusinesses.filter((b) => b.status === "approved").length;
  const gmv = allOrders
    .filter((o) => o.status === "completed" || o.status === "delivered")
    .reduce((sum, o) => sum + Number(o.grand_total), 0);

  // Keyed by ISO date so it sorts correctly regardless of query order;
  // formatted for display only after sorting.
  const salesByDate = new Map<string, number>();
  for (const o of allOrders) {
    const isoDate = o.created_at.slice(0, 10);
    salesByDate.set(isoDate, (salesByDate.get(isoDate) ?? 0) + Number(o.grand_total));
  }
  const salesData = Array.from(salesByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([isoDate, total]) => ({
      date: new Date(isoDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      total,
    }));

  const statusCounts: Record<string, number> = {};
  for (const o of allOrders) {
    const label = o.status.charAt(0).toUpperCase() + o.status.slice(1);
    statusCounts[label] = (statusCounts[label] ?? 0) + 1;
  }
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const recentBusinesses = allBusinesses.slice(0, 6);
  const recentOrders = allOrders.slice(0, 6);

  return (
    <div>
      <PageHeader
        title="Platform overview"
        description="Marketplace-wide activity across every business on Pharma Q."
        action={
          <Link href="/businesses/new">
            <Button size="sm">Create business</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total businesses" value={formatNumber(allBusinesses.length)} icon={Building2} tone="primary" />
        <StatCard label="Approved businesses" value={formatNumber(approvedCount)} icon={Building2} tone="success" />
        <StatCard label="Pending approvals" value={formatNumber(pendingCount)} icon={Clock} tone="warning" />
        <StatCard label="Platform GMV" value={formatCurrency(gmv)} icon={IndianRupee} tone="success" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Order value trend" description="Across all businesses" />
          <CardBody>
            <SalesChart data={salesData} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Order status" />
          <CardBody>
            <OrderStatusChart data={statusData} />
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Approval queue"
            description="Newest businesses pending review"
            action={
              <Link href="/businesses?status=pending" className="text-xs font-medium text-primary-600 hover:underline">
                View all
              </Link>
            }
          />
          <CardBody>
            {recentBusinesses.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No businesses yet.</p>
            ) : (
              <div className="flex flex-col divide-y divide-slate-50">
                {recentBusinesses.map((b) => (
                  <Link
                    key={b.id}
                    href={`/businesses/${b.id}`}
                    className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">{b.name}</p>
                      <p className="text-xs text-slate-400">{[b.city, b.state].filter(Boolean).join(", ") || "—"}</p>
                    </div>
                    <Badge tone={b.status === "approved" ? "success" : b.status === "pending" ? "warning" : "danger"}>
                      {b.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Recent orders"
            description="Latest activity across the marketplace"
            action={
              <ShoppingCart className="h-4 w-4 text-slate-400" />
            }
          />
          <CardBody>
            {recentOrders.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No orders yet.</p>
            ) : (
              <div className="flex flex-col divide-y divide-slate-50">
                {recentOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{o.order_number}</p>
                      <p className="text-xs text-slate-400">
                        {o.buyer?.name ?? "Unknown buyer"} → {o.supplier?.name ?? "Unknown supplier"}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-slate-700">{formatCurrency(Number(o.grand_total))}</span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
