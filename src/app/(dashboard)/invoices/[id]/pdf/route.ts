import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { InvoiceDocument } from "@/components/invoices/InvoiceDocument";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getCurrentBusiness();
  if (!ctx) return new NextResponse("Unauthorized", { status: 401 });

  const supabase = await createClient();

  const { data: invoice } = await supabase.from("invoices").select("*").eq("id", id).single();
  if (!invoice) return new NextResponse("Not found", { status: 404 });

  const { data: order } = await supabase
    .from("supplier_orders")
    .select("order_number, supplier_business_id, buyer_business_id")
    .eq("id", invoice.supplier_order_id)
    .single();

  if (!order || order.supplier_business_id !== ctx.business.id) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const [{ data: items }, { data: buyer }] = await Promise.all([
    supabase.from("supplier_order_items").select("*").eq("supplier_order_id", invoice.supplier_order_id),
    supabase.from("businesses").select("*").eq("id", order.buyer_business_id).single(),
  ]);

  const buffer = await renderToBuffer(
    InvoiceDocument({
      invoice,
      orderNumber: order.order_number,
      items: items ?? [],
      supplier: ctx.business,
      buyer: buyer ?? { name: "Unknown buyer", address_line1: null, city: null, state: null, gstin: null },
    }),
  );

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoice_number}.pdf"`,
    },
  });
}
