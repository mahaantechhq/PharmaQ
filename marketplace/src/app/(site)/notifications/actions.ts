"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";

export async function markNotificationRead(notificationId: string) {
  const ctx = await getCurrentBusiness();
  if (!ctx) throw new Error("Not authenticated");

  const supabase = await createClient();
  await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId).eq("business_id", ctx.business.id);

  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const ctx = await getCurrentBusiness();
  if (!ctx) throw new Error("Not authenticated");

  const supabase = await createClient();
  await supabase.from("notifications").update({ is_read: true }).eq("business_id", ctx.business.id).eq("is_read", false);

  revalidatePath("/notifications");
}
