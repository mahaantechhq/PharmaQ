"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/supabase/current-admin";
import { logAudit } from "@/lib/audit";
import { bannerSchema, type BannerFormValues } from "@/lib/validations/marketing";

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
