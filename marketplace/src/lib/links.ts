import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// A retailer only sees products from wholesalers a super admin has linked
// them to (see 0022_retailer_wholesaler_links.sql). cache() memoizes this
// per request since most product-facing pages need it.
export const getLinkedWholesalerIds = cache(async (retailerBusinessId: string): Promise<string[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("retailer_wholesaler_links")
    .select("wholesaler_business_id")
    .eq("retailer_business_id", retailerBusinessId);

  return (data ?? []).map((row) => row.wholesaler_business_id);
});
