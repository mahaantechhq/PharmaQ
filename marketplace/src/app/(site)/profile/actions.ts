"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { businessProfileSchema, type BusinessProfileFormValues } from "@/lib/validations/business";

export async function updateBusinessProfile(values: BusinessProfileFormValues) {
  const ctx = await getCurrentBusiness();
  if (!ctx) throw new Error("Not authenticated");

  const parsed = businessProfileSchema.parse(values);
  const supabase = await createClient();

  const { error } = await supabase
    .from("businesses")
    .update({
      name: parsed.name,
      phone: parsed.phone || null,
      email: parsed.email || null,
      gstin: parsed.gstin || null,
      drug_license_no: parsed.drug_license_no || null,
      address_line1: parsed.address_line1 || null,
      address_line2: parsed.address_line2 || null,
      city: parsed.city || null,
      state: parsed.state || null,
      pincode: parsed.pincode || null,
    })
    .eq("id", ctx.business.id);

  if (error) throw new Error(error.message);

  revalidatePath("/profile");
}
