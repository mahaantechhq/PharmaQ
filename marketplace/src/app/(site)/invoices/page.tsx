import { FileText } from "lucide-react";
import { requireCurrentBusiness } from "@/lib/supabase/require-business";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";

export default async function InvoicesPage() {
  const ctx = await requireCurrentBusiness("/invoices");
  const supabase = await createClient();

  const { data: supplierOrderIds } = await supabase
    .from("supplier_orders")
    .select("id")
    .eq("buyer_business_id", ctx.business.id);

  const ids = (supplierOrderIds ?? []).map((o) => o.id);

  const { data: invoices } = ids.length
    ? await supabase
        .from("invoices")
        .select("*, supplier_orders(order_number, businesses:supplier_business_id(name))")
        .in("supplier_order_id", ids)
        .order("invoice_date", { ascending: false })
    : { data: [] };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Invoices</h1>

      {(invoices ?? []).length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-24 text-slate-400">
          <FileText className="h-8 w-8" />
          <p className="text-sm">Invoices will appear here once a supplier invoices your order.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Invoice No.</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoices ?? []).map((inv: any) => (
                <tr key={inv.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-700">{inv.invoice_number}</td>
                  <td className="px-4 py-3 text-slate-500">{inv.supplier_orders?.order_number}</td>
                  <td className="px-4 py-3 text-slate-500">{inv.supplier_orders?.businesses?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(inv.invoice_date).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{formatCurrency(Number(inv.grand_total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
