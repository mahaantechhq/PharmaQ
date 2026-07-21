"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { offerSchema, type OfferFormValues } from "@/lib/validations/offer";

export async function createOffer(values: OfferFormValues) {
  const ctx = await getCurrentBusiness();
  if (!ctx) throw new Error("Not authenticated");

  const parsed = offerSchema.parse(values);
  const supabase = await createClient();

  const { error } = await supabase.from("offers").insert({
    business_id: ctx.business.id,
    name: parsed.name,
    display_text: parsed.display_text,
    discount_type: parsed.discount_type,
    discount_value: parsed.discount_value,
    min_order_amount: parsed.min_order_amount,
    max_order_amount: parsed.max_order_amount || null,
    starts_at: parsed.starts_at || null,
    expires_at: parsed.expires_at,
    status: parsed.status,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/offers");
}

export async function deleteOffer(offerId: string) {
  const ctx = await getCurrentBusiness();
  if (!ctx) throw new Error("Not authenticated");

  const supabase = await createClient();
  const { error } = await supabase.from("offers").delete().eq("id", offerId).eq("business_id", ctx.business.id);
  if (error) throw new Error(error.message);

  revalidatePath("/offers");
}

export async function toggleOfferStatus(offerId: string, status: "active" | "inactive") {
  const ctx = await getCurrentBusiness();
  if (!ctx) throw new Error("Not authenticated");

  const supabase = await createClient();
  const { error } = await supabase.from("offers").update({ status }).eq("id", offerId).eq("business_id", ctx.business.id);
  if (error) throw new Error(error.message);

  revalidatePath("/offers");
}
