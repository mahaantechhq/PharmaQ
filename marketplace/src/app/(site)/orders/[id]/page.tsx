import { notFound } from "next/navigation";
import Link from "next/link";
import { requireCurrentBusiness } from "@/lib/supabase/require-business";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatusTimeline } from "@/components/orders/StatusTimeline";
import { formatCurrency, formatDate } from "@/lib/format";
import type { OrderStatusHistory, SupplierOrderItem } from "@/lib/types/database";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireCurrentBusiness(`/orders/${id}`);
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("buyer_business_id", ctx.business.id)
    .maybeSingle();

  if (!order) notFound();

  const { data: supplierOrders } = await supabase
    .from("supplier_orders")
    .select("*, businesses:supplier_business_id(name, city, state)")
    .eq("order_id", id);

  const supplierOrderIds = (supplierOrders ?? []).map((so) => so.id);
  const [{ data: allItems }, { data: allHistory }] = await Promise.all([
    supplierOrderIds.length
      ? supabase.from("supplier_order_items").select("*").in("supplier_order_id", supplierOrderIds)
      : Promise.resolve({ data: [] as SupplierOrderItem[] }),
    supplierOrderIds.length
      ? supabase.from("order_status_history").select("*").in("supplier_order_id", supplierOrderIds)
      : Promise.resolve({ data: [] as OrderStatusHistory[] }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">{order.order_number}</h1>
      <p className="mb-6 text-sm text-slate-500">
        Placed on {formatDate(order.created_at, { day: "2-digit", month: "long", year: "numeric" })} · {formatCurrency(Number(order.grand_total))} total
      </p>

      <div className="flex flex-col gap-6">
        {(supplierOrders ?? []).map((so: any) => {
          const items = (allItems ?? []).filter((i) => i.supplier_order_id === so.id);
          const history = (allHistory ?? []).filter((h) => h.supplier_order_id === so.id);

          return (
            <Card key={so.id}>
              <CardHeader
                title={
                  <Link href={`/suppliers/${so.supplier_business_id}`} className="hover:text-primary-600">
                    {so.businesses?.name ?? "Unknown supplier"}
                  </Link>
                }
                description={`${items.length} item${items.length !== 1 ? "s" : ""} · ${formatCurrency(Number(so.grand_total))}`}
                action={<StatusBadge status={so.status} />}
              />
              <CardBody>
                <div className="mb-4 flex flex-col divide-y divide-slate-50 rounded-lg border border-slate-100">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="text-slate-700">{item.product_name} × {item.quantity}</span>
                      <span className="font-medium text-slate-700">{formatCurrency(Number(item.line_total))}</span>
                    </div>
                  ))}
                </div>
                {Number(so.discount_total) > 0 && (
                  <p className="mb-4 text-xs font-medium text-success-600">
                    Offer discount applied: -{formatCurrency(Number(so.discount_total))}
                  </p>
                )}
                <StatusTimeline history={history} />
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
