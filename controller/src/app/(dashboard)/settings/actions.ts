"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/supabase/current-admin";
import { logAudit } from "@/lib/audit";

export interface PlatformSettingsValues {
  site_name: string;
  support_email: string;
  support_phone: string;
  default_commission_percent: number;
  maintenance_mode: boolean;
}

export async function updatePlatformSettings(values: PlatformSettingsValues) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authenticated as super admin");

  if (typeof values.default_commission_percent !== "number" || Number.isNaN(values.default_commission_percent)) {
    throw new Error("Default commission must be a number");
  }

  const supabase = await createClient();

  const rows = Object.entries(values).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("platform_settings").upsert(rows, { onConflict: "key" });
  if (error) throw new Error(error.message);

  await logAudit({ actorId: admin.adminId, action: "settings.update", entityType: "platform_settings", metadata: { ...values } });

  revalidatePath("/settings");
}
