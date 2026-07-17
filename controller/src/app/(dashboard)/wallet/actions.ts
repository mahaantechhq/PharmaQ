"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/supabase/current-admin";
import { logAudit } from "@/lib/audit";

export async function adjustWallet(businessId: string, type: "credit" | "debit", amount: number, description: string) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authenticated as super admin");
  if (amount <= 0) throw new Error("Amount must be greater than 0");

  const supabase = await createClient();

  // Locks the wallet row and does the balance check + update + transaction
  // log in one transaction, so two concurrent adjustments against the same
  // wallet can't read-then-write over each other — see
  // 0008_security_and_atomicity_fixes.sql.
  const { error: adjustError } = await supabase.rpc("adjust_wallet_balance", {
    p_business_id: businessId,
    p_type: type,
    p_amount: amount,
    p_description: description || null,
  });
  if (adjustError) throw new Error(adjustError.message);

  await supabase.from("notifications").insert({
    business_id: businessId,
    title: type === "credit" ? "Wallet credited" : "Wallet debited",
    message: `₹${amount.toLocaleString("en-IN")} ${type === "credit" ? "credited to" : "debited from"} your wallet by Pharma Q. ${description}`,
    type: "wallet",
  });

  await logAudit({
    actorId: admin.adminId,
    action: `wallet.${type}`,
    entityType: "wallet",
    entityId: businessId,
    metadata: { businessId, amount, description },
  });

  revalidatePath("/wallet");
}

export async function updateCreditLimit(businessId: string, creditLimit: number) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authenticated as super admin");
  if (creditLimit < 0) throw new Error("Credit limit cannot be negative");

  const supabase = await createClient();
  const { error } = await supabase
    .from("wallets")
    .update({ credit_limit: creditLimit, updated_at: new Date().toISOString() })
    .eq("business_id", businessId);
  if (error) throw new Error(error.message);

  await logAudit({
    actorId: admin.adminId,
    action: "wallet.credit_limit",
    entityType: "wallet",
    entityId: businessId,
    metadata: { creditLimit },
  });

  revalidatePath("/wallet");
}
