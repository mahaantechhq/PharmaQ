"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { STATUS_FLOW } from "@/lib/orders";
import type { SupplierOrderStatus } from "@/lib/types/database";

export async function updateOrderStatus(
  supplierOrderId: string,
  nextStatus: SupplierOrderStatus,
  note?: string,
) {
  const ctx = await getCurrentBusiness();
  if (!ctx) throw new Error("Not authenticated");

  const supabase = await createClient();

  const { data: order, error: fetchError } = await supabase
    .from("supplier_orders")
    .select("status")
    .eq("id", supplierOrderId)
    .eq("supplier_business_id", ctx.business.id)
    .single();

  if (fetchError || !order) throw new Error("Order not found");

  if (!STATUS_FLOW[order.status as SupplierOrderStatus].includes(nextStatus)) {
    throw new Error(`Cannot move order from ${order.status} to ${nextStatus}`);
  }

  // Both RPCs re-check the expected current status under a row lock and do
  // the status update + history insert (+ FIFO stock deduction, + invoice
  // upsert) in one transaction — see 0008_security_and_atomicity_fixes.sql.
  // This is what actually prevents a double "Accept" click (or two tabs)
  // from deducting stock twice, which a plain client-side check can't.
  const { error } =
    nextStatus === "accepted"
      ? await supabase.rpc("accept_supplier_order", { p_supplier_order_id: supplierOrderId })
      : await supabase.rpc("transition_supplier_order_status", {
          p_supplier_order_id: supplierOrderId,
          p_expected_status: order.status,
          p_next_status: nextStatus,
          p_note: note || null,
        });

  if (error) throw new Error(error.message);

  revalidatePath("/orders");
  revalidatePath(`/orders/${supplierOrderId}`);
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
}
