import Link from "next/link";
import { FileDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";

export default async function InvoicesPage() {
  const ctx = await getCurrentBusiness();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data: supplierOrderIds } = await supabase
    .from("supplier_orders")
    .select("id")
    .eq("supplier_business_id", ctx.business.id);

  const ids = (supplierOrderIds ?? []).map((o) => o.id);

  const { data: invoices } =
    ids.length > 0
      ? await supabase
          .from("invoices")
          .select("*, supplier_orders(order_number, businesses:buyer_business_id(name))")
          .in("supplier_order_id", ids)
          .order("invoice_date", { ascending: false })
      : { data: [] };

  return (
    <div>
      <PageHeader title="Invoices" description="Invoices generated for orders you've fulfilled." />
      <Card>
        <CardBody>
          {(invoices ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No invoices yet. Invoices are generated once you accept and invoice an order.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-2.5">Invoice No.</th>
                    <th className="px-3 py-2.5">Order</th>
                    <th className="px-3 py-2.5">Buyer</th>
                    <th className="px-3 py-2.5">Date</th>
                    <th className="px-3 py-2.5">Amount</th>
                    <th className="px-3 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {(invoices ?? []).map((inv: any) => (
                    <tr key={inv.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-3 py-3 font-medium text-slate-700">{inv.invoice_number}</td>
                      <td className="px-3 py-3 text-slate-500">{inv.supplier_orders?.order_number}</td>
                      <td className="px-3 py-3 text-slate-500">{inv.supplier_orders?.businesses?.name ?? "—"}</td>
                      <td className="px-3 py-3 text-slate-500">{new Date(inv.invoice_date).toLocaleDateString("en-IN")}</td>
                      <td className="px-3 py-3 font-medium text-slate-700">{formatCurrency(Number(inv.grand_total))}</td>
                      <td className="px-3 py-3">
                        <Link href={`/invoices/${inv.id}/pdf`} target="_blank">
                          <Button variant="outline" size="sm">
                            <FileDown className="h-4 w-4" /> PDF
                          </Button>
                        </Link>
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
