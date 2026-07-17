"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { getCartSummary, type CartLine } from "@/lib/checkout";
import { validateCoupon } from "@/lib/coupons";

function orderNumber() {
  return `PQ-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function placeOrder(couponCode?: string) {
  const ctx = await getCurrentBusiness();
  if (!ctx) throw new Error("Please sign in to place an order");

  const supabase = await createClient();
  const summary = await getCartSummary(ctx.business.id);

  if (summary.lines.length === 0) throw new Error("Your cart is empty");

  const insufficient = summary.lines.find((l) => l.quantity > l.availableStock);
  if (insufficient) throw new Error(`${insufficient.productName} only has ${insufficient.availableStock} units available`);

  let discount = 0;
  let appliedCouponId: string | null = null;
  if (couponCode) {
    const result = await validateCoupon(couponCode, summary.subtotal);
    discount = result.discount;
    appliedCouponId = result.coupon.id;
  }

  const bySupplier = new Map<string, { businessId: string; businessName: string; lines: CartLine[] }>();
  for (const line of summary.lines) {
    const existing = bySupplier.get(line.businessId) ?? { businessId: line.businessId, businessName: line.businessName, lines: [] };
    existing.lines.push(line);
    bySupplier.set(line.businessId, existing);
  }
  const supplierGroups = Array.from(bySupplier.values());
  const grandTotalBeforeDiscount = summary.grandTotal;

  // Split subtotal/tax/discount per supplier, with the last group absorbing
  // any rounding remainder — then derive the MASTER totals as the sum of
  // these already-rounded group figures (not recomputed independently from
  // all lines), so the master order's totals always reconcile exactly with
  // the sum of its supplier orders instead of drifting by a paisa.
  let discountRemaining = discount;
  let masterSubtotal = 0;
  let masterTax = 0;

  const supplierOrderPayload = supplierGroups.map((group, i) => {
    const isLast = i === supplierGroups.length - 1;

    const groupSubtotal = Math.round(group.lines.reduce((sum, l) => sum + l.lineTotal, 0) * 100) / 100;
    const groupTax = Math.round(group.lines.reduce((sum, l) => sum + (l.lineTotal * l.gstRate) / 100, 0) * 100) / 100;
    const groupTotal = Math.round((groupSubtotal + groupTax) * 100) / 100;

    const share = discount > 0 ? Math.round((groupTotal / grandTotalBeforeDiscount) * discount * 100) / 100 : 0;
    const groupDiscount = isLast ? discountRemaining : Math.min(share, discountRemaining);
    discountRemaining = Math.round((discountRemaining - groupDiscount) * 100) / 100;
    const groupGrandTotal = Math.round((groupTotal - groupDiscount) * 100) / 100;

    masterSubtotal += groupSubtotal;
    masterTax += groupTax;

    return {
      supplierBusinessId: group.businessId,
      subtotal: groupSubtotal,
      taxTotal: groupTax,
      grandTotal: groupGrandTotal,
      notificationMessage: `${ctx.business.name} placed a new order worth ₹${groupGrandTotal.toLocaleString("en-IN")}.`,
      items: group.lines.map((l) => ({
        productId: l.productId,
        batchId: l.batchId,
        productName: l.productName,
        batchNumber: l.batchNumber,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        gstRate: l.gstRate,
        lineTotal: l.lineTotal,
      })),
    };
  });

  const masterGrandTotal = Math.round((masterSubtotal + masterTax - discount) * 100) / 100;
  const masterOrderNumber = orderNumber();

  // One transaction: master order + every supplier order + items + status
  // history + notifications. A failure partway through now rolls back
  // everything instead of leaving orphaned rows and an uncleared cart that
  // would duplicate on retry — see 0008_security_and_atomicity_fixes.sql.
  const { data: orderId, error } = await supabase.rpc("create_order_with_splits", {
    p_order_number: masterOrderNumber,
    p_buyer_business_id: ctx.business.id,
    p_subtotal: Math.round(masterSubtotal * 100) / 100,
    p_tax_total: Math.round(masterTax * 100) / 100,
    p_grand_total: masterGrandTotal,
    p_supplier_orders: supplierOrderPayload,
  });
  if (error) throw new Error(error.message);

  if (appliedCouponId) {
    await supabase.rpc("increment_coupon_usage", { p_coupon_id: appliedCouponId });
  }

  await supabase.from("cart_items").delete().eq("buyer_business_id", ctx.business.id);

  revalidatePath("/cart");
  revalidatePath("/orders");

  return { orderId: orderId as string, orderNumber: masterOrderNumber };
}
