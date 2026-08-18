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

  // business + business_owner + wallet are one transaction inside this RPC
  // (see 0008_security_and_atomicity_fixes.sql). The auth user above is a
  // separate service (Supabase Auth, not this database) and can never be
  // part of that transaction — if the RPC fails, clean it up here so the
  // admin can retry with the same email instead of hitting "already
  // registered" on a phantom account with no business attached.
  const supabase = await createClient();
  const { data: businessId, error: provisionError } = await supabase.rpc("provision_business", {
    p_owner_id: authUser.user.id,
    p_name: parsed.name,
    p_slug: `${slugify(parsed.name)}-${Date.now().toString(36)}`,
    p_owner_name: parsed.ownerName,
    p_email: parsed.email,
    p_phone: parsed.phone || null,
    p_gstin: parsed.gstin || null,
    p_drug_license_no: parsed.drug_license_no || null,
    p_address_line1: parsed.address_line1 || null,
    p_city: parsed.city || null,
    p_state: parsed.state || null,
    p_pincode: parsed.pincode || null,
    p_business_type: parsed.business_type,
  });

  if (provisionError) {
    await adminClient.auth.admin.deleteUser(authUser.user.id);
    throw new Error(provisionError.message);
  }

  await logAudit({
    actorId: admin.adminId,
    action: "business.create",
    entityType: "business",
    entityId: businessId as string,
    metadata: { name: parsed.name, email: parsed.email },
  });

  revalidatePath("/businesses");
  revalidatePath("/dashboard");

  return { businessId: businessId as string, email: parsed.email, password: parsed.password };
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

export async function updateBusinessProfile(businessId: string, ownerId: string, values: BusinessProfileFormValues) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authenticated as super admin");

  const parsed = businessProfileSchema.parse(values);
  const supabase = await createClient();

  const [{ error }, { error: ownerError }] = await Promise.all([
    supabase
      .from("businesses")
      .update({
        name: parsed.name,
        business_type: parsed.business_type,
        phone: parsed.phone || null,
        email: parsed.email || null,
        gstin: parsed.gstin || null,
        drug_license_no: parsed.drug_license_no || null,
        address_line1: parsed.address_line1 || null,
        city: parsed.city || null,
        state: parsed.state || null,
        pincode: parsed.pincode || null,
      })
      .eq("id", businessId),
    supabase
      .from("business_owners")
      .update({ full_name: parsed.ownerName })
      .eq("id", ownerId)
      .eq("business_id", businessId),
  ]);

  if (error) throw new Error(error.message);
  if (ownerError) throw new Error(ownerError.message);

  await logAudit({
    actorId: admin.adminId,
    action: "business.update_profile",
    entityType: "business",
    entityId: businessId,
  });

  revalidatePath(`/businesses/${businessId}`);
}

export async function lookupBusinessByAccessCode(accessCode: string) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authenticated as super admin");

  const supabase = await createClient();
  const code = accessCode.trim().toUpperCase();
  const { data: row } = await supabase
    .from("business_access_codes")
    .select("business:business_id(id, name, city, state, status)")
    .eq("access_code", code)
    .maybeSingle();

  if (!row) throw new Error("No business found with that access code");
  return row.business as unknown as { id: string; name: string; city: string | null; state: string | null; status: string };
}

export async function linkRetailerByCode(wholesalerBusinessId: string, retailerAccessCode: string) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authenticated as super admin");

  const supabase = await createClient();

  const code = retailerAccessCode.trim().toUpperCase();
  const { data: row } = await supabase
    .from("business_access_codes")
    .select("business:business_id(id, name)")
    .eq("access_code", code)
    .maybeSingle();
  const retailer = row?.business as unknown as { id: string; name: string } | null;
  if (!retailer) throw new Error("No business found with that access code");
  if (retailer.id === wholesalerBusinessId) throw new Error("A business can't be linked to itself");

  const { error } = await supabase.from("retailer_wholesaler_links").insert({
    wholesaler_business_id: wholesalerBusinessId,
    retailer_business_id: retailer.id,
  });
  if (error) {
    if (error.code === "23505") throw new Error(`${retailer.name} is already linked`);
    throw new Error(error.message);
  }

  await logAudit({
    actorId: admin.adminId,
    action: "business.link_retailer",
    entityType: "business",
    entityId: wholesalerBusinessId,
    metadata: { retailerBusinessId: retailer.id, retailerName: retailer.name },
  });

  revalidatePath(`/businesses/${wholesalerBusinessId}`);
  return { retailerId: retailer.id, retailerName: retailer.name };
}

export async function unlinkRetailer(linkId: string, wholesalerBusinessId: string) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authenticated as super admin");

  const supabase = await createClient();
  const { error } = await supabase.from("retailer_wholesaler_links").delete().eq("id", linkId);
  if (error) throw new Error(error.message);

  await logAudit({
    actorId: admin.adminId,
    action: "business.unlink_retailer",
    entityType: "business",
    entityId: wholesalerBusinessId,
    metadata: { linkId },
  });

  revalidatePath(`/businesses/${wholesalerBusinessId}`);
}

export async function updateBusinessOwnerPassword(businessId: string, ownerId: string, newPassword: string) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authenticated as super admin");
  if (newPassword.length < 8) throw new Error("Password must be at least 8 characters");

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.updateUserById(ownerId, { password: newPassword });
  if (error) throw new Error(error.message);

  await logAudit({
    actorId: admin.adminId,
    action: "business.reset_owner_password",
    entityType: "business",
    entityId: businessId,
  });
}
