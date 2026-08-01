"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { getAvailableStock } from "@/lib/stock";

export async function addToCart(productId: string, quantity: number) {
  const ctx = await getCurrentBusiness();
  if (!ctx) throw new Error("Please sign in to add items to your cart");
  if (quantity <= 0) throw new Error("Quantity must be greater than 0");

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("buyer_business_id", ctx.business.id)
    .eq("product_id", productId)
    .maybeSingle();

  const newQuantity = (existing?.quantity ?? 0) + quantity;
  const availableStock = await getAvailableStock(productId);
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
      .select("product_id")
      .eq("id", cartItemId)
      .eq("buyer_business_id", ctx.business.id)
      .maybeSingle();
    if (!cartItem) throw new Error("Cart item not found");

    const availableStock = await getAvailableStock(cartItem.product_id);
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
}

export async function removeCartItem(cartItemId: string) {
  const ctx = await getCurrentBusiness();
  if (!ctx) throw new Error("Not authenticated");

  const supabase = await createClient();
  const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId).eq("buyer_business_id", ctx.business.id);
  if (error) throw new Error(error.message);

  revalidatePath("/cart");
}
