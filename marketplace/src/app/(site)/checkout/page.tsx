import Link from "next/link";
import { requireCurrentBusiness } from "@/lib/supabase/require-business";
import { getCartSummary } from "@/lib/checkout";
import { validateCoupon } from "@/lib/coupons";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { CheckoutConfirm } from "@/components/checkout/CheckoutConfirm";
import { formatCurrency } from "@/lib/format";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ coupon?: string }> }) {
  const { coupon } = await searchParams;
  const ctx = await requireCurrentBusiness("/checkout");
  const summary = await getCartSummary(ctx.business.id);

  let discount = 0;
  let couponError: string | null = null;
  if (coupon) {
    try {
      const result = await validateCoupon(coupon, summary.subtotal);
      discount = result.discount;
    } catch (err) {
      couponError = err instanceof Error ? err.message : "Invalid coupon";
    }
  }

  const supplierGroups = new Map<string, string>();
  for (const line of summary.lines) supplierGroups.set(line.businessId, line.businessName);

  const finalTotal = Math.round((summary.grandTotal - discount) * 100) / 100;

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
            {coupon && !couponError && (
              <div className="flex justify-between text-success-600">
                <span>Coupon ({coupon.toUpperCase()})</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            {couponError && <p className="text-xs text-danger-500">{couponError} — proceeding without discount.</p>}
            <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold text-slate-900">
              <span>Total</span>
              <span>{formatCurrency(finalTotal)}</span>
            </div>
          </div>

          <div className="mt-6">
            <CheckoutConfirm couponCode={couponError ? undefined : coupon} />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
