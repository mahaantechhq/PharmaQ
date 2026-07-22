import Link from "next/link";
import { requireCurrentBusiness } from "@/lib/supabase/require-business";
import { getCartSummary } from "@/lib/checkout";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { CheckoutConfirm } from "@/components/checkout/CheckoutConfirm";
import { formatCurrency } from "@/lib/format";

export default async function CheckoutPage() {
  const ctx = await requireCurrentBusiness("/checkout");
  const summary = await getCartSummary(ctx.business.id);

  const supplierGroups = new Map<string, string>();
  for (const line of summary.lines) supplierGroups.set(line.businessId, line.businessName);

  if (summary.lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <p className="text-slate-500">Your cart is empty.</p>
        <Link href="/search" className="mt-2 inline-block text-primary-600 hover:underline">Browse products</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Confirm your order</h1>

      <Card>
        <CardHeader
          title={`${supplierGroups.size} order${supplierGroups.size !== 1 ? "s" : ""} will be created`}
          description="Each supplier fulfills their portion independently."
        />
        <CardBody>
          <div className="flex flex-col divide-y divide-slate-50">
            {Array.from(supplierGroups.entries()).map(([id, name]) => {
              const lines = summary.lines.filter((l) => l.businessId === id);
              const total = lines.reduce((sum, l) => sum + l.lineTotal, 0);
              return (
                <div key={id} className="py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-800">{name}</p>
                    <p className="text-sm font-medium text-slate-700">{formatCurrency(total)}</p>
                  </div>
                  <p className="text-xs text-slate-400">{lines.length} item{lines.length !== 1 && "s"}</p>
                  <div className="mt-2 flex flex-col gap-1 rounded-lg bg-slate-50 px-3 py-2">
                    {lines.map((l) => (
                      <div key={l.cartItemId} className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">{l.productName} × {l.quantity}</span>
                        <span className="font-medium text-slate-700">{formatCurrency(l.lineTotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{formatCurrency(summary.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Tax</span>
              <span>{formatCurrency(summary.taxTotal)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold text-slate-900">
              <span>Total</span>
              <span>{formatCurrency(summary.grandTotal)}</span>
            </div>
          </div>

          <div className="mt-6">
            <CheckoutConfirm />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
