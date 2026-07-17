import { createClient } from "@/lib/supabase/server";
import type { Business, BusinessOwner } from "@/lib/types/database";

export interface CurrentBusinessContext {
  ownerId: string;
  owner: BusinessOwner;
  business: Business;
}

export async function getCurrentBusiness(): Promise<CurrentBusinessContext | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: owner } = await supabase
    .from("business_owners")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!owner) return null;

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", owner.business_id)
    .single();

  if (!business) return null;

  return { ownerId: user.id, owner, business };
}
