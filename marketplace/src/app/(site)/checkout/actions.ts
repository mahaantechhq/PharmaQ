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
  let appliedCoupon: { id: string; usedCount: number } | null = null;
  if (couponCode) {
    const result = await validateCoupon(couponCode, summary.subtotal);
    discount = result.discount;
    appliedCoupon = { id: result.coupon.id, usedCount: result.coupon.used_count };
  }

  const bySupplier = new Map<string, { businessId: string; businessName: string; lines: CartLine[] }>();
  for (const line of summary.lines) {
    const existing = bySupplier.get(line.businessId) ?? { businessId: line.businessId, businessName: line.businessName, lines: [] };
    existing.lines.push(line);
    bySupplier.set(line.businessId, existing);
  }
  const supplierGroups = Array.from(bySupplier.values());

  const grandTotalBeforeDiscount = summary.grandTotal;
  const finalGrandTotal = Math.round((grandTotalBeforeDiscount - discount) * 100) / 100;

  const masterOrderNumber = orderNumber();

  const { data: masterOrder, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: masterOrderNumber,
      buyer_business_id: ctx.business.id,
      subtotal: summary.subtotal,
      tax_total: summary.taxTotal,
      grand_total: finalGrandTotal,
    })
    .select("id")
    .single();
  if (orderError) throw new Error(orderError.message);

  let discountRemaining = discount;

  for (let i = 0; i < supplierGroups.length; i++) {
    const group = supplierGroups[i];
    const isLast = i === supplierGroups.length - 1;

    const groupSubtotal = Math.round(group.lines.reduce((sum, l) => sum + l.lineTotal, 0) * 100) / 100;
    const groupTax = Math.round(group.lines.reduce((sum, l) => sum + (l.lineTotal * l.gstRate) / 100, 0) * 100) / 100;
    const groupTotal = Math.round((groupSubtotal + groupTax) * 100) / 100;

    const share = discount > 0 ? Math.round((groupTotal / grandTotalBeforeDiscount) * discount * 100) / 100 : 0;
    const groupDiscount = isLast ? discountRemaining : Math.min(share, discountRemaining);
    discountRemaining = Math.round((discountRemaining - groupDiscount) * 100) / 100;
    const groupGrandTotal = Math.round((groupTotal - groupDiscount) * 100) / 100;

    const { data: supplierOrder, error: soError } = await supabase
      .from("supplier_orders")
      .insert({
        order_id: masterOrder.id,
        order_number: masterOrderNumber,
        supplier_business_id: group.businessId,
        buyer_business_id: ctx.business.id,
        status: "placed",
        subtotal: groupSubtotal,
        tax_total: groupTax,
        grand_total: groupGrandTotal,
      })
      .select("id")
      .single();
    if (soError) throw new Error(soError.message);

    const items = group.lines.map((l) => ({
      supplier_order_id: supplierOrder.id,
      product_id: l.productId,
      batch_id: l.batchId,
      product_name: l.productName,
      batch_number: l.batchNumber,
      quantity: l.quantity,
      unit_price: l.unitPrice,
      gst_rate: l.gstRate,
      line_total: l.lineTotal,
    }));
    const { error: itemsError } = await supabase.from("supplier_order_items").insert(items);
    if (itemsError) throw new Error(itemsError.message);

    const { error: historyError } = await supabase.from("order_status_history").insert({
      supplier_order_id: supplierOrder.id,
      status: "placed",
    });
    if (historyError) throw new Error(historyError.message);

    const { error: notifError } = await supabase.from("notifications").insert({
      business_id: group.businessId,
      title: "New order received",
      message: `${ctx.business.name} placed a new order (${masterOrderNumber}) worth ₹${groupGrandTotal.toLocaleString("en-IN")}.`,
      type: "order",
    });
    if (notifError) throw new Error(notifError.message);
  }

  if (appliedCoupon) {
    await supabase.from("coupons").update({ used_count: appliedCoupon.usedCount + 1 }).eq("id", appliedCoupon.id);
  }

  await supabase.from("cart_items").delete().eq("buyer_business_id", ctx.business.id);

  revalidatePath("/cart");
  revalidatePath("/orders");

  return { orderId: masterOrder.id as string, orderNumber: masterOrderNumber };
}
