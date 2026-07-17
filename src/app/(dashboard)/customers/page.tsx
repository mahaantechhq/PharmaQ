import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { formatCurrency, formatNumber } from "@/lib/format";

export default async function CustomersPage() {
  const ctx = await getCurrentBusiness();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data: customers } = await supabase
    .from("business_customers")
    .select("*")
    .eq("supplier_business_id", ctx.business.id)
    .order("total_spent", { ascending: false });

  return (
    <div>
      <PageHeader title="Customers" description="Businesses that have bought from your storefront." />
      <Card>
        <CardBody>
          {(customers ?? []).length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
              <Users className="h-8 w-8" />
              <p className="text-sm">No customers yet — orders you receive will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-2.5">Business</th>
                    <th className="px-3 py-2.5">Total orders</th>
                    <th className="px-3 py-2.5">Total spent</th>
                    <th className="px-3 py-2.5">Last order</th>
                  </tr>
                </thead>
                <tbody>
                  {(customers ?? []).map((c) => (
                    <tr key={c.buyer_business_id} className="border-b border-slate-50 last:border-0">
                      <td className="px-3 py-3 font-medium text-slate-700">{c.buyer_name}</td>
                      <td className="px-3 py-3">{formatNumber(c.total_orders)}</td>
                      <td className="px-3 py-3 font-medium text-slate-700">{formatCurrency(Number(c.total_spent))}</td>
                      <td className="px-3 py-3 text-slate-500">
                        {new Date(c.last_order_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
