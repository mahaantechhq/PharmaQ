import Link from "next/link";
import { Package } from "lucide-react";
import { requireCurrentBusiness } from "@/lib/supabase/require-business";
import { createClient } from "@/lib/supabase/server";
import { OrdersHero } from "@/components/orders/OrdersHero";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const ctx = await requireCurrentBusiness("/orders");
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select("id, order_number, grand_total, created_at")
    .eq("buyer_business_id", ctx.business.id);

  if (q) query = query.ilike("order_number", `%${q}%`);

  const { data: orders } = await query.order("created_at", { ascending: false });

  const orderIds = (orders ?? []).map((o) => o.id);
  const { data: supplierOrders } = orderIds.length
    ? await supabase.from("supplier_orders").select("order_id, status, businesses:supplier_business_id(name)").in("order_id", orderIds)
    : { data: [] };

  const groupsByOrder = new Map<string, { status: string; supplierName: string }[]>();
  for (const so of supplierOrders ?? []) {
    const list = groupsByOrder.get(so.order_id) ?? [];
    list.push({ status: so.status, supplierName: (so as any).businesses?.name ?? "Unknown" });
    groupsByOrder.set(so.order_id, list);
  }

  return (
    <div>
      <OrdersHero ownerName={ctx.owner.full_name} />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {(orders ?? []).length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-24 text-slate-400">
            <Package className="h-8 w-8" />
            <p className="text-sm">{q ? "No orders match your search." : "You haven't placed any orders yet."}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {(orders ?? []).map((o) => {
              const suppliers = groupsByOrder.get(o.id) ?? [];
              return (
                <Link
                  key={o.id}
                  href={`/orders/${o.id}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{o.order_number}</p>
                    <p className="text-xs text-slate-400">
                      {formatDate(o.created_at)} · {suppliers.length} supplier{suppliers.length !== 1 && "s"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {suppliers.map((s, i) => (
                        <StatusBadge key={i} status={s.status as any} />
                      ))}
                    </div>
                  </div>
                  <span className="text-base font-semibold text-slate-900">{formatCurrency(Number(o.grand_total))}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
