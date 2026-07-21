import { createClient } from "@/lib/supabase/server";
import type { Offer } from "@/lib/types/database";

export interface OfferSummary {
  displayText: string;
  discountType: Offer["discount_type"];
  discountValue: number;
  minOrderAmount: number;
}

function toSummary(offer: Offer): OfferSummary {
  return {
    displayText: offer.display_text,
    discountType: offer.discount_type,
    discountValue: Number(offer.discount_value),
    minOrderAmount: Number(offer.min_order_amount),
  };
}

// RLS (offers_select_active_public) already restricts this to currently
// live offers (active status, within starts_at/expires_at), so no date
// filtering is needed here.
export async function getActiveOffersByBusiness(businessIds: string[]): Promise<Map<string, OfferSummary>> {
  if (businessIds.length === 0) return new Map();

  const supabase = await createClient();
  const { data } = await supabase
    .from("offers")
    .select("*")
    .in("business_id", businessIds)
    .order("created_at", { ascending: false });

  const map = new Map<string, OfferSummary>();
  for (const offer of (data ?? []) as Offer[]) {
    if (!map.has(offer.business_id)) map.set(offer.business_id, toSummary(offer));
  }
  return map;
}
