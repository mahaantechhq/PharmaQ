"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdmin } from "@/lib/supabase/current-admin";
import { logAudit } from "@/lib/audit";
import {
  createBusinessSchema,
  businessProfileSchema,
  type CreateBusinessFormValues,
  type BusinessProfileFormValues,
} from "@/lib/validations/business";
import type { BusinessStatus } from "@/lib/types/database";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createBusiness(values: CreateBusinessFormValues) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authenticated as super admin");

  const parsed = createBusinessSchema.parse(values);
  const adminClient = createAdminClient();

  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email: parsed.email,
    password: parsed.password,
    email_confirm: true,
  });
  if (authError) throw new Error(authError.message);

  const { data: business, error: bizError } = await adminClient
    .from("businesses")
    .insert({
      name: parsed.name,
      slug: `${slugify(parsed.name)}-${Date.now().toString(36)}`,
      status: "approved",
      approved_at: new Date().toISOString(),
      email: parsed.email,
      phone: parsed.phone || null,
      gstin: parsed.gstin || null,
      drug_license_no: parsed.drug_license_no || null,
      address_line1: parsed.address_line1 || null,
      city: parsed.city || null,
      state: parsed.state || null,
      pincode: parsed.pincode || null,
    })
    .select()
    .single();
  if (bizError) throw new Error(bizError.message);

  const { error: ownerError } = await adminClient.from("business_owners").insert({
    id: authUser.user.id,
    business_id: business.id,
    full_name: parsed.ownerName,
    phone: parsed.phone || null,
  });
  if (ownerError) throw new Error(ownerError.message);

  const { error: walletError } = await adminClient.from("wallets").insert({
    business_id: business.id,
    balance: 0,
    credit_limit: 0,
  });
  if (walletError) throw new Error(walletError.message);

  await logAudit({
    actorId: admin.adminId,
    action: "business.create",
    entityType: "business",
    entityId: business.id,
    metadata: { name: parsed.name, email: parsed.email },
  });

  revalidatePath("/businesses");
  revalidatePath("/dashboard");

  return { businessId: business.id as string, email: parsed.email, password: parsed.password };
}

export async function updateBusinessStatus(businessId: string, status: BusinessStatus) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authenticated as super admin");

  const supabase = await createClient();
  const { error } = await supabase
    .from("businesses")
    .update({
      status,
      approved_at: status === "approved" ? new Date().toISOString() : undefined,
    })
    .eq("id", businessId);

  if (error) throw new Error(error.message);

  await logAudit({
    actorId: admin.adminId,
    action: `business.${status}`,
    entityType: "business",
    entityId: businessId,
  });

  revalidatePath("/businesses");
  revalidatePath(`/businesses/${businessId}`);
  revalidatePath("/dashboard");
}

export async function updateBusinessProfile(businessId: string, values: BusinessProfileFormValues) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authenticated as super admin");

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
      city: parsed.city || null,
      state: parsed.state || null,
      pincode: parsed.pincode || null,
    })
    .eq("id", businessId);

  if (error) throw new Error(error.message);

  await logAudit({
    actorId: admin.adminId,
    action: "business.update_profile",
    entityType: "business",
    entityId: businessId,
  });

  revalidatePath(`/businesses/${businessId}`);
}
