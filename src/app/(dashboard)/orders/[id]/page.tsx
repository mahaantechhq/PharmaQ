import { notFound } from "next/navigation";
import Link from "next/link";
import { FileDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { StatusTimeline } from "@/components/orders/StatusTimeline";
import { formatCurrency, formatDate } from "@/lib/format";
import type { OrderStatusHistory, SupplierOrderItem } from "@/lib/types/database";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getCurrentBusiness();
  if (!ctx) return null;

  const supabase = await createClient();

  const [{ data: order }, { data: items }, { data: history }, { data: invoice }] = await Promise.all([
    supabase
      .from("supplier_orders")
      .select("*, businesses:buyer_business_id(name, city, state, phone, email)")
      .eq("id", id)
      .eq("supplier_business_id", ctx.business.id)
      .single(),
    supabase.from("supplier_order_items").select("*").eq("supplier_order_id", id),
    supabase.from("order_status_history").select("*").eq("supplier_order_id", id),
    supabase.from("invoices").select("id").eq("supplier_order_id", id).maybeSingle(),
  ]);

  if (!order) notFound();

  const buyer = (order as any).businesses;

  return (
    <div>
      <PageHeader
        title={order.order_number}
        description={`Placed on ${formatDate(order.created_at, { day: "2-digit", month: "long", year: "numeric" })}`}
        action={
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            {invoice && (
              <Link href={`/invoices/${invoice.id}/pdf`} target="_blank">
                <Button variant="outline" size="sm">
                  <FileDown className="h-4 w-4" /> Invoice
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader title="Order items" />
            <CardBody>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <th className="px-3 py-2.5">Product</th>
                      <th className="px-3 py-2.5">Batch</th>
                      <th className="px-3 py-2.5">Qty</th>
                      <th className="px-3 py-2.5">Unit price</th>
                      <th className="px-3 py-2.5">GST</th>
                      <th className="px-3 py-2.5">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {((items ?? []) as SupplierOrderItem[]).map((item) => (
                      <tr key={item.id} className="border-b border-slate-50 last:border-0">
                        <td className="px-3 py-3 font-medium text-slate-700">{item.product_name}</td>
                        <td className="px-3 py-3 text-slate-500">{item.batch_number ?? "—"}</td>
                        <td className="px-3 py-3">{item.quantity}</td>
                        <td className="px-3 py-3">{formatCurrency(Number(item.unit_price))}</td>
                        <td className="px-3 py-3">{Number(item.gst_rate)}%</td>
                        <td className="px-3 py-3 font-medium text-slate-700">{formatCurrency(Number(item.line_total))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-col items-end gap-1 border-t border-slate-100 pt-4 text-sm">
                <div className="flex w-48 justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(Number(order.subtotal))}</span>
                </div>
                {Number(order.discount_total) > 0 && (
                  <div className="flex w-48 justify-between text-success-600">
                    <span>Offer discount</span>
                    <span>-{formatCurrency(Number(order.discount_total))}</span>
                  </div>
                )}
                <div className="flex w-48 justify-between text-slate-500">
                  <span>Tax</span>
                  <span>{formatCurrency(Number(order.tax_total))}</span>
                </div>
                <div className="flex w-48 justify-between text-base font-semibold text-slate-900">
                  <span>Total</span>
                  <span>{formatCurrency(Number(order.grand_total))}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Buyer" />
            <CardBody>
              <p className="text-sm font-medium text-slate-800">{buyer?.name ?? "Unknown buyer"}</p>
              {buyer?.city && <p className="mt-1 text-sm text-slate-500">{buyer.city}, {buyer.state}</p>}
              {buyer?.phone && <p className="mt-1 text-sm text-slate-500">{buyer.phone}</p>}
              {buyer?.email && <p className="text-sm text-slate-500">{buyer.email}</p>}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Status history" />
            <CardBody>
              <StatusTimeline history={(history ?? []) as OrderStatusHistory[]} />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
