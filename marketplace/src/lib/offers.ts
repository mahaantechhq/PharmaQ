import { createClient } from "@/lib/supabase/server";
import type { Offer } from "@/lib/types/database";

export interface OfferSummary {
  id: string;
  displayText: string;
  discountType: Offer["discount_type"];
  discountValue: number;
  minOrderAmount: number;
  maxOrderAmount: number | null;
}

function toSummary(offer: Offer): OfferSummary {
  return {
    id: offer.id,
    displayText: offer.display_text,
    discountType: offer.discount_type,
    discountValue: Number(offer.discount_value),
    minOrderAmount: Number(offer.min_order_amount),
    maxOrderAmount: offer.max_order_amount != null ? Number(offer.max_order_amount) : null,
  };
}

// Applied at checkout: an offer is only eligible for a supplier's group of
// items once the group subtotal falls within [minOrderAmount, maxOrderAmount].
// When multiple offers from the same business are eligible, the one giving
// the buyer the biggest discount wins.
export function pickBestOffer(
  offers: OfferSummary[],
  subtotal: number,
): { offer: OfferSummary; discountAmount: number } | null {
  let best: { offer: OfferSummary; discountAmount: number } | null = null;

  for (const offer of offers) {
    if (subtotal < offer.minOrderAmount) continue;
    if (offer.maxOrderAmount != null && subtotal > offer.maxOrderAmount) continue;

    const raw = offer.discountType === "flat" ? offer.discountValue : (subtotal * offer.discountValue) / 100;
    const discountAmount = Math.round(Math.min(raw, subtotal) * 100) / 100;

    if (!best || discountAmount > best.discountAmount) best = { offer, discountAmount };
  }

  return best;
}

// Unlike getActiveOffersByBusiness (one offer per business, for marketing
// badges), this keeps every active offer so checkout can pick the best
// eligible one for the actual cart subtotal.
export async function getEligibleOffersByBusiness(businessIds: string[]): Promise<Map<string, OfferSummary[]>> {
  if (businessIds.length === 0) return new Map();

  const supabase = await createClient();
  const { data } = await supabase.from("offers").select("*").in("business_id", businessIds);

  const map = new Map<string, OfferSummary[]>();
  for (const offer of (data ?? []) as Offer[]) {
    const list = map.get(offer.business_id) ?? [];
    list.push(toSummary(offer));
    map.set(offer.business_id, list);
  }
  return map;
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
