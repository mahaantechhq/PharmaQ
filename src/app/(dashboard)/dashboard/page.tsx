import Link from "next/link";
import { IndianRupee, ShoppingCart, Package, AlertTriangle, Plus, Upload, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { OrderStatusChart } from "@/components/dashboard/OrderStatusChart";
import { ExpiryAlertList } from "@/components/dashboard/ExpiryAlertList";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { SupplierOrder, SupplierOrderStatus } from "@/lib/types/database";

const ACTIVE_STATUSES: SupplierOrderStatus[] = ["placed", "accepted", "invoiced", "packed", "shipped"];

export default async function DashboardPage() {
  const ctx = await getCurrentBusiness();
  if (!ctx) return null;

  const supabase = await createClient();
  const businessId = ctx.business.id;

  const [{ data: orders }, { data: products }, { data: batches }] = await Promise.all([
    supabase
      .from("supplier_orders")
      .select("*")
      .eq("supplier_business_id", businessId)
      .order("created_at", { ascending: false }),
    supabase.from("products").select("id, status").eq("business_id", businessId),
    supabase
      .from("product_batches")
      .select("id, batch_number, expiry_date, stock_qty, product_id, products(name)")
      .eq("business_id", businessId)
      .gt("stock_qty", 0)
      .order("expiry_date", { ascending: true }),
  ]);

  const allOrders = (orders ?? []) as SupplierOrder[];
  const revenue = allOrders
    .filter((o) => o.status === "completed" || o.status === "delivered")
    .reduce((sum, o) => sum + Number(o.grand_total), 0);
  const pendingOrders = allOrders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;
  const activeProducts = (products ?? []).filter((p) => p.status === "active").length;

  const now = new Date();
  const thirtyDaysOut = new Date(now.getTime() + 30 * 86400000);
  const expiringSoon = (batches ?? []).filter((b) => {
    const exp = new Date(b.expiry_date);
    return exp >= now && exp <= thirtyDaysOut;
  });

  // Keyed by ISO date so it sorts correctly regardless of the order
  // `allOrders` came back in (it's fetched newest-first for the recent
  // orders list below); formatted for display only after sorting.
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

  const recentOrders = allOrders.slice(0, 6);

  const expiryAlerts = expiringSoon.slice(0, 6).map((b: any) => ({
    id: b.id,
    productName: b.products?.name ?? "Unknown product",
    batchNumber: b.batch_number,
    expiryDate: b.expiry_date,
    stockQty: b.stock_qty,
  }));

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${ctx.owner.full_name.split(" ")[0]}`}
        description={`Here's what's happening at ${ctx.business.name} today.`}
        action={
          <div className="flex gap-2">
            <Link href="/products/new">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4" /> Add product
              </Button>
            </Link>
            <Link href="/orders">
              <Button size="sm">
                <ShoppingCart className="h-4 w-4" /> View orders
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue" value={formatCurrency(revenue)} icon={IndianRupee} tone="success" />
        <StatCard label="Total orders" value={formatNumber(allOrders.length)} icon={ShoppingCart} tone="primary" />
        <StatCard label="Pending orders" value={formatNumber(pendingOrders)} icon={FileText} tone="warning" />
        <StatCard label="Active products" value={formatNumber(activeProducts)} icon={Package} tone="primary" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Sales trend" description="Order value over recent activity" />
          <CardBody>
            <SalesChart data={salesData} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Order status" description="Breakdown of all orders" />
          <CardBody>
            <OrderStatusChart data={statusData} />
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent orders"
            description="Latest orders received from buyer businesses"
            action={
              <Link href="/orders" className="text-xs font-medium text-primary-600 hover:underline">
                View all
              </Link>
            }
          />
          <CardBody>
            {recentOrders.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No orders yet.</p>
            ) : (
              <div className="flex flex-col divide-y divide-slate-50">
                {recentOrders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/orders/${o.id}`}
                    className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">{o.order_number}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(o.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-700">{formatCurrency(Number(o.grand_total))}</span>
                      <StatusBadge status={o.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Expiring soon"
            description="Batches expiring within 30 days"
            action={<AlertTriangle className="h-4 w-4 text-warning-500" />}
          />
          <CardBody>
            <ExpiryAlertList alerts={expiryAlerts} />
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <QuickAction href="/products/new" icon={Plus} label="Add a product" description="List a new product to your storefront" />
        <QuickAction href="/products/bulk-upload" icon={Upload} label="Bulk upload" description="Import products via CSV" />
        <QuickAction href="/invoices" icon={FileText} label="View invoices" description="Download invoices for delivered orders" />
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  description,
}: {
  href: string;
  icon: typeof Plus;
  label: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <Card className="flex items-center gap-3 p-4 transition-shadow hover:shadow-[var(--shadow-card-hover)]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">{label}</p>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </Card>
    </Link>
  );
}
