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

  const { data: wallet, error: walletError } = await supabase
    .from("wallets")
    .select("*")
    .eq("business_id", businessId)
    .single();
  if (walletError || !wallet) throw new Error("Wallet not found");

  const newBalance = type === "credit" ? Number(wallet.balance) + amount : Number(wallet.balance) - amount;
  if (newBalance < 0) throw new Error("Insufficient balance for this debit");

  const { error: updateError } = await supabase
    .from("wallets")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("id", wallet.id);
  if (updateError) throw new Error(updateError.message);

  const { error: txnError } = await supabase.from("wallet_transactions").insert({
    wallet_id: wallet.id,
    type,
    amount,
    reference_type: "admin_adjustment",
    description: description || `Manual ${type} by super admin`,
  });
  if (txnError) throw new Error(txnError.message);

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
    entityId: wallet.id,
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
