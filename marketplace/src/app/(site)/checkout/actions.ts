"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { getCartSummary, type CartLine } from "@/lib/checkout";
import type { SupabaseClient } from "@supabase/supabase-js";

// e.g. "Medwell Surgicals" + 5th order for that business -> "medwell-pq005".
// The sequence is this buyer's own order count, not a global one.
async function generateOrderNumber(supabase: SupabaseClient, buyerBusinessId: string, businessName: string, attempt: number) {
  const firstWord = (businessName.trim().split(/\s+/)[0] || "business").toLowerCase().replace(/[^a-z0-9]/g, "");
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("buyer_business_id", buyerBusinessId);
  const seq = (count ?? 0) + 1 + attempt;
  return `${firstWord}-pq${String(seq).padStart(3, "0")}`;
}

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
  // The order number is derived from this buyer's own order count, which
  // isn't collision-proof under concurrent checkouts from the same
  // business (two tabs, a double-click) -- retry a few times on a unique
  // violation rather than letting a rare race fail the whole checkout.
  let orderId: string | null = null;
  let masterOrderNumber = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    masterOrderNumber = await generateOrderNumber(supabase, ctx.business.id, ctx.business.name, attempt);

    const { data, error } = await supabase.rpc("create_order_with_splits", {
      p_order_number: masterOrderNumber,
      p_buyer_business_id: ctx.business.id,
      p_subtotal: Math.round(masterSubtotal * 100) / 100,
      p_tax_total: Math.round(masterTax * 100) / 100,
      p_grand_total: masterGrandTotal,
      p_supplier_orders: supplierOrderPayload,
    });

    if (!error) {
      orderId = data as string;
      break;
    }
    if (error.code !== "23505" || attempt === 4) throw new Error(error.message);
  }

  await supabase.from("cart_items").delete().eq("buyer_business_id", ctx.business.id);

  revalidatePath("/cart");
  revalidatePath("/orders");

  return { orderId: orderId as string, orderNumber: masterOrderNumber };
}
