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
    .select("*")
    .eq("id", supplierOrderId)
    .eq("supplier_business_id", ctx.business.id)
    .single();

  if (fetchError || !order) throw new Error("Order not found");

  if (!STATUS_FLOW[order.status as SupplierOrderStatus].includes(nextStatus)) {
    throw new Error(`Cannot move order from ${order.status} to ${nextStatus}`);
  }

  // Accepting the order commits stock via FIFO deduction.
  if (nextStatus === "accepted") {
    const { data: items } = await supabase
      .from("supplier_order_items")
      .select("product_id, quantity")
      .eq("supplier_order_id", supplierOrderId);

    for (const item of items ?? []) {
      const { error: fifoError } = await supabase.rpc("deduct_stock_fifo", {
        p_product_id: item.product_id,
        p_qty: item.quantity,
      });
      if (fifoError) throw new Error(`Stock error: ${fifoError.message}`);
    }
  }

  const { error: updateError } = await supabase
    .from("supplier_orders")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", supplierOrderId);

  if (updateError) throw new Error(updateError.message);

  await supabase.from("order_status_history").insert({
    supplier_order_id: supplierOrderId,
    status: nextStatus,
    note: note || null,
    changed_by: ctx.ownerId,
  });

  if (nextStatus === "invoiced") {
    const invoiceNumber = `INV-${order.order_number}`;
    await supabase.from("invoices").upsert(
      {
        supplier_order_id: supplierOrderId,
        invoice_number: invoiceNumber,
        subtotal: order.subtotal,
        tax_total: order.tax_total,
        grand_total: order.grand_total,
      },
      { onConflict: "supplier_order_id" },
    );
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${supplierOrderId}`);
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
}
