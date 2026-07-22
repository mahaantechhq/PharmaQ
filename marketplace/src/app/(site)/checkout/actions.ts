"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { getCartSummary, type CartLine } from "@/lib/checkout";

export async function placeOrder() {
  const ctx = await getCurrentBusiness();
  if (!ctx) throw new Error("Please sign in to place an order");

  const supabase = await createClient();
  const summary = await getCartSummary(ctx.business.id);

  if (summary.lines.length === 0) throw new Error("Your cart is empty");

  const insufficient = summary.lines.find((l) => l.quantity > l.availableStock);
  if (insufficient) throw new Error(`${insufficient.productName} only has ${insufficient.availableStock} units available`);

  const bySupplier = new Map<string, { businessId: string; businessName: string; lines: CartLine[] }>();
  for (const line of summary.lines) {
    const existing = bySupplier.get(line.businessId) ?? { businessId: line.businessId, businessName: line.businessName, lines: [] };
    existing.lines.push(line);
    bySupplier.set(line.businessId, existing);
  }
  const supplierGroups = Array.from(bySupplier.values());

  // Derive the MASTER totals as the sum of each supplier group's already-
  // rounded figures (not recomputed independently from all lines), so the
  // master order's totals always reconcile exactly with the sum of its
  // supplier orders instead of drifting by a paisa.
  let masterSubtotal = 0;
  let masterTax = 0;

  const supplierOrderPayload = supplierGroups.map((group) => {
    const groupSubtotal = Math.round(group.lines.reduce((sum, l) => sum + l.lineTotal, 0) * 100) / 100;
    const groupTax = Math.round(group.lines.reduce((sum, l) => sum + (l.lineTotal * l.gstRate) / 100, 0) * 100) / 100;
    const groupGrandTotal = Math.round((groupSubtotal + groupTax) * 100) / 100;

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

  const masterGrandTotal = Math.round((masterSubtotal + masterTax) * 100) / 100;

  // One transaction: master order + every supplier order + items + status
  // history + notifications. A failure partway through now rolls back
  // everything instead of leaving orphaned rows and an uncleared cart that
  // would duplicate on retry — see 0008_security_and_atomicity_fixes.sql.
  //
  // The order number is generated inside this RPC via nextval() on a
  // dedicated Postgres sequence (0015_order_number_sequence.sql) -- a
  // single atomic operation, so unlike counting existing rows there's no
  // read-then-write race window and no retry-on-collision needed here.
  const { data, error } = await supabase.rpc("create_order_with_splits", {
    p_buyer_business_id: ctx.business.id,
    p_subtotal: Math.round(masterSubtotal * 100) / 100,
    p_tax_total: Math.round(masterTax * 100) / 100,
    p_grand_total: masterGrandTotal,
    p_supplier_orders: supplierOrderPayload,
  });
  if (error) throw new Error(error.message);

  const result = (data as { id: string; order_number: string }[])[0];

  await supabase.from("cart_items").delete().eq("buyer_business_id", ctx.business.id);

  revalidatePath("/cart");
  revalidatePath("/orders");

  return { orderId: result.id, orderNumber: result.order_number };
}
