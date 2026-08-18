"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/supabase/current-admin";
import { logAudit } from "@/lib/audit";
import { currentPeriod } from "@/lib/period";

export async function markSubscriptionPaid(businessId: string, amount: number) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authenticated as super admin");
  if (amount <= 0) throw new Error("Amount must be greater than 0");

  const supabase = await createClient();
  const period = currentPeriod();

  const { error } = await supabase.from("business_subscription_payments").upsert(
    {
      business_id: businessId,
      period,
      amount,
      status: "paid",
      paid_at: new Date().toISOString(),
      marked_by: admin.adminId,
    },
    { onConflict: "business_id,period" },
  );
  if (error) throw new Error(error.message);

  await supabase.from("notifications").insert({
    business_id: businessId,
    title: "Subscription payment recorded",
    message: `Your ₹${amount.toLocaleString("en-IN")} monthly subscription payment has been marked as paid by Pharma Q.`,
    type: "system",
  });

  await logAudit({
    actorId: admin.adminId,
    action: "subscription.mark_paid",
    entityType: "business",
    entityId: businessId,
    metadata: { period, amount },
  });

  revalidatePath("/payments");
}

export async function markSubscriptionUnpaid(businessId: string, amount: number) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authenticated as super admin");

  const supabase = await createClient();
  const period = currentPeriod();

  const { error } = await supabase.from("business_subscription_payments").upsert(
    {
      business_id: businessId,
      period,
      amount,
      status: "unpaid",
      paid_at: null,
      marked_by: admin.adminId,
    },
    { onConflict: "business_id,period" },
  );
  if (error) throw new Error(error.message);

  await logAudit({
    actorId: admin.adminId,
    action: "subscription.mark_unpaid",
    entityType: "business",
    entityId: businessId,
    metadata: { period },
  });

  revalidatePath("/payments");
}

export async function updateSubscriptionFee(amount: number) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authenticated as super admin");
  if (amount < 0) throw new Error("Fee cannot be negative");

  const supabase = await createClient();
  const { error } = await supabase
    .from("platform_settings")
    .upsert({ key: "subscription_fee", value: { amount }, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);

  await logAudit({
    actorId: admin.adminId,
    action: "subscription.update_fee",
    entityType: "platform_setting",
    entityId: "subscription_fee",
    metadata: { amount },
  });

  revalidatePath("/payments");
}
