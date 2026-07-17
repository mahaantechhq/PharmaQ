"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";

export async function toggleWishlist(productId: string) {
  const ctx = await getCurrentBusiness();
  if (!ctx) throw new Error("Please sign in to use your wishlist");

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("wishlist_items")
    .select("id")
    .eq("business_id", ctx.business.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("wishlist_items").delete().eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("wishlist_items").insert({ business_id: ctx.business.id, product_id: productId });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/wishlist");
  revalidatePath("/products");
  return !existing;
}
