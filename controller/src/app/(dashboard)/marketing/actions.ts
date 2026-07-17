"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/supabase/current-admin";
import { logAudit } from "@/lib/audit";
import { couponSchema, bannerSchema, type CouponFormValues, type BannerFormValues } from "@/lib/validations/marketing";

export async function createCoupon(values: CouponFormValues) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authenticated as super admin");

  const parsed = couponSchema.parse(values);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("coupons")
    .insert({
      code: parsed.code,
      description: parsed.description || null,
      discount_type: parsed.discount_type,
      discount_value: parsed.discount_value,
      min_order_value: parsed.min_order_value,
      max_discount: parsed.max_discount || null,
      valid_from: parsed.valid_from || null,
      valid_until: parsed.valid_until || null,
      usage_limit: parsed.usage_limit || null,
      status: parsed.status,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await logAudit({ actorId: admin.adminId, action: "coupon.create", entityType: "coupon", entityId: data.id, metadata: { code: parsed.code } });
  revalidatePath("/marketing/coupons");
}

export async function deleteCoupon(couponId: string) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authenticated as super admin");

  const supabase = await createClient();
  const { error } = await supabase.from("coupons").delete().eq("id", couponId);
  if (error) throw new Error(error.message);

  await logAudit({ actorId: admin.adminId, action: "coupon.delete", entityType: "coupon", entityId: couponId });
  revalidatePath("/marketing/coupons");
}

export async function toggleCouponStatus(couponId: string, status: "active" | "inactive") {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authenticated as super admin");

  const supabase = await createClient();
  const { error } = await supabase.from("coupons").update({ status }).eq("id", couponId);
  if (error) throw new Error(error.message);

  await logAudit({ actorId: admin.adminId, action: "coupon.status", entityType: "coupon", entityId: couponId, metadata: { status } });
  revalidatePath("/marketing/coupons");
}

export async function createBanner(values: BannerFormValues) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authenticated as super admin");

  const parsed = bannerSchema.parse(values);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("banners")
    .insert({
      title: parsed.title,
      image_url: parsed.image_url,
      link_url: parsed.link_url || null,
      position: parsed.position,
      sort_order: parsed.sort_order,
      status: parsed.status,
      starts_at: parsed.starts_at || null,
      ends_at: parsed.ends_at || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await logAudit({ actorId: admin.adminId, action: "banner.create", entityType: "banner", entityId: data.id, metadata: { title: parsed.title } });
  revalidatePath("/marketing/banners");
}

export async function deleteBanner(bannerId: string) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authenticated as super admin");

  const supabase = await createClient();
  const { error } = await supabase.from("banners").delete().eq("id", bannerId);
  if (error) throw new Error(error.message);

  await logAudit({ actorId: admin.adminId, action: "banner.delete", entityType: "banner", entityId: bannerId });
  revalidatePath("/marketing/banners");
}

export async function toggleBannerStatus(bannerId: string, status: "active" | "inactive") {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authenticated as super admin");

  const supabase = await createClient();
  const { error } = await supabase.from("banners").update({ status }).eq("id", bannerId);
  if (error) throw new Error(error.message);

  await logAudit({ actorId: admin.adminId, action: "banner.status", entityType: "banner", entityId: bannerId, metadata: { status } });
  revalidatePath("/marketing/banners");
}
