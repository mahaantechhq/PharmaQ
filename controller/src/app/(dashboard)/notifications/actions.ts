"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/supabase/current-admin";
import { logAudit } from "@/lib/audit";

export async function broadcastNotification(businessId: string | "all", title: string, message: string) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authenticated as super admin");
  if (!title.trim() || !message.trim()) throw new Error("Title and message are required");

  const supabase = await createClient();

  let businessIds: string[];
  if (businessId === "all") {
    const { data } = await supabase.from("businesses").select("id");
    businessIds = (data ?? []).map((b) => b.id);
  } else {
    businessIds = [businessId];
  }

  const rows = businessIds.map((id) => ({
    business_id: id,
    title: title.trim(),
    message: message.trim(),
    type: "system" as const,
  }));

  const { error } = await supabase.from("notifications").insert(rows);
  if (error) throw new Error(error.message);

  await logAudit({
    actorId: admin.adminId,
    action: "notification.broadcast",
    entityType: "notification",
    metadata: { businessId, title, recipientCount: businessIds.length },
  });

  revalidatePath("/notifications");
}
