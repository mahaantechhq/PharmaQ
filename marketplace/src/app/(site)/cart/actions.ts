"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { getAvailableStock } from "@/lib/stock";
import { getLinkedWholesalerIds } from "@/lib/links";
import { getCartSummary, type CartLine } from "@/lib/checkout";
import { getEligibleOffersByBusiness, pickBestOffer } from "@/lib/offers";

export async function addToCart(productId: string, quantity: number) {
  const ctx = await getCurrentBusiness();
  if (!ctx) throw new Error("Please sign in to add items to your cart");
  if (quantity <= 0) throw new Error("Quantity must be greater than 0");

  const supabase = await createClient();

  // None of these four depend on each other -- run them together instead
  // of one at a time.
  const [{ data: product }, linkedWholesalerIds, { data: existing }, availableStock] = await Promise.all([
    supabase.from("products").select("business_id").eq("id", productId).maybeSingle(),
    getLinkedWholesalerIds(ctx.business.id),
    supabase.from("cart_items").select("id, quantity").eq("buyer_business_id", ctx.business.id).eq("product_id", productId).maybeSingle(),
    getAvailableStock(productId),
  ]);
  if (!product) throw new Error("Product not found");
  if (!linkedWholesalerIds.includes(product.business_id)) {
    throw new Error("You're not linked to this supplier");
  }

  const newQuantity = (existing?.quantity ?? 0) + quantity;
  if (newQuantity > availableStock) {
    throw new Error(`Only ${availableStock} unit${availableStock === 1 ? "" : "s"} available`);
  }

  if (existing) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("cart_items").insert({
      buyer_business_id: ctx.business.id,
      product_id: productId,
      quantity,
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/cart");
  return getCartSummary(ctx.business.id);
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  const ctx = await getCurrentBusiness();
  if (!ctx) throw new Error("Not authenticated");

  const supabase = await createClient();

  if (quantity <= 0) {
    const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId).eq("buyer_business_id", ctx.business.id);
    if (error) throw new Error(error.message);
  } else {
    const { data: cartItem } = await supabase
      .from("cart_items")
      .select("product_id, products:product_id(business_id)")
      .eq("id", cartItemId)
      .eq("buyer_business_id", ctx.business.id)
      .maybeSingle();
    if (!cartItem) throw new Error("Cart item not found");

    const [linkedWholesalerIds, availableStock] = await Promise.all([
      getLinkedWholesalerIds(ctx.business.id),
      getAvailableStock(cartItem.product_id),
    ]);
    if (!linkedWholesalerIds.includes((cartItem as any).products?.business_id)) {
      throw new Error("You're no longer linked to this supplier");
    }
    if (quantity > availableStock) {
      throw new Error(`Only ${availableStock} unit${availableStock === 1 ? "" : "s"} available`);
    }

    const { error } = await supabase
      .from("cart_items")
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq("id", cartItemId)
      .eq("buyer_business_id", ctx.business.id);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/cart");
  return getCartSummary(ctx.business.id);
}

export async function removeCartItem(cartItemId: string) {
  const ctx = await getCurrentBusiness();
  if (!ctx) throw new Error("Not authenticated");

  const supabase = await createClient();
  const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId).eq("buyer_business_id", ctx.business.id);
  if (error) throw new Error(error.message);

  revalidatePath("/cart");
  return getCartSummary(ctx.business.id);
}

export async function placeOrder() {
  const ctx = await getCurrentBusiness();
  if (!ctx) throw new Error("Please sign in to place an order");

  const supabase = await createClient();

  // Doesn't depend on the cart contents (only ctx.business.id, already
  // known), so fire it off now instead of waiting until after
  // getCartSummary resolves below.
  const linkedWholesalerIdsPromise = getLinkedWholesalerIds(ctx.business.id);

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

  // A link can be revoked after items are already in the cart -- re-check
  // here so checkout can't complete an order with a wholesaler the buyer
  // is no longer linked to, even though addToCart/updateCartItemQuantity
  // already check this on the way in.
  const [linkedWholesalerIds, offersByBusiness] = await Promise.all([
    linkedWholesalerIdsPromise,
    // Discount is recomputed here server-side (not trusted from the client)
    // -- same logic as applyOfferDiscounts, applied per supplier group
    // since offers are business-owned.
    getEligibleOffersByBusiness(supplierGroups.map((g) => g.businessId)),
  ]);
  const unlinkedGroup = supplierGroups.find((g) => !linkedWholesalerIds.includes(g.businessId));
  if (unlinkedGroup) {
    throw new Error(`You're no longer linked to ${unlinkedGroup.businessName}. Remove their items from your cart to continue.`);
  }

  // Derive the MASTER totals as the sum of each supplier group's already-
  // rounded figures (not recomputed independently from all lines), so the
  // master order's totals always reconcile exactly with the sum of its
  // supplier orders instead of drifting by a paisa.
  let masterSubtotal = 0;
  let masterTax = 0;
  let masterDiscount = 0;

  const supplierOrderPayload = supplierGroups.map((group) => {
    const groupSubtotal = Math.round(group.lines.reduce((sum, l) => sum + l.lineTotal, 0) * 100) / 100;
    const best = pickBestOffer(offersByBusiness.get(group.businessId) ?? [], groupSubtotal);
    const discountRatio = best && groupSubtotal > 0 ? best.discountAmount / groupSubtotal : 0;
    const groupTax =
      Math.round(
        group.lines.reduce((sum, l) => sum + (l.lineTotal * (1 - discountRatio) * l.gstRate) / 100, 0) * 100,
      ) / 100;
    const groupDiscount = best?.discountAmount ?? 0;
    const groupGrandTotal = Math.round((groupSubtotal - groupDiscount + groupTax) * 100) / 100;

    masterSubtotal += groupSubtotal;
    masterTax += groupTax;
    masterDiscount += groupDiscount;

    return {
      supplierBusinessId: group.businessId,
      subtotal: groupSubtotal,
      taxTotal: groupTax,
      discountTotal: groupDiscount,
      offerId: best?.offer.id ?? null,
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

  const masterGrandTotal = Math.round((masterSubtotal - masterDiscount + masterTax) * 100) / 100;

  // One transaction: master order + every supplier order + items + status
  // history + notifications. A failure partway through now rolls back
  // everything instead of leaving orphaned rows and an uncleared cart that
  // would duplicate on retry — see 0008_security_and_atomicity_fixes.sql.
  //
  // The order number is generated inside this RPC via nextval() on a
  // dedicated Postgres sequence (0015_order_number_sequence.sql) -- a
  // single atomic operation, so unlike counting existing rows there's no
  // read-then-write race window and no retry-on-collision needed here.
  // The cart is cleared inside this same function/transaction too
  // (0027_clear_cart_in_order_rpc.sql), not as a separate round trip.
  const { data, error } = await supabase.rpc("create_order_with_splits", {
    p_buyer_business_id: ctx.business.id,
    p_subtotal: Math.round(masterSubtotal * 100) / 100,
    p_tax_total: Math.round(masterTax * 100) / 100,
    p_discount_total: Math.round(masterDiscount * 100) / 100,
    p_grand_total: masterGrandTotal,
    p_supplier_orders: supplierOrderPayload,
  });
  if (error) throw new Error(error.message);

  const result = (data as { id: string; order_number: string }[])[0];

  revalidatePath("/cart");
  revalidatePath("/orders");

  return { orderId: result.id, orderNumber: result.order_number };
}
