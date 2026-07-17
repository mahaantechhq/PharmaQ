import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { InventoryExplorer, type InventoryRow } from "@/components/products/InventoryExplorer";

export default async function InventoryPage() {
  const ctx = await getCurrentBusiness();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data: batches } = await supabase
    .from("product_batches")
    .select("id, product_id, batch_number, expiry_date, mrp, selling_price, stock_qty, products(name)")
    .eq("business_id", ctx.business.id)
    .order("expiry_date", { ascending: true });

  const rows: InventoryRow[] = (batches ?? []).map((b: any) => ({
    id: b.id,
    productId: b.product_id,
    productName: b.products?.name ?? "Unknown product",
    batchNumber: b.batch_number,
    expiryDate: b.expiry_date,
    mrp: Number(b.mrp),
    sellingPrice: Number(b.selling_price),
    stockQty: b.stock_qty,
  }));

  return (
    <div>
      <PageHeader title="Inventory" description="Batch-level stock and expiry across all your products. FIFO deduction uses the soonest-expiring batch first." />
      <Card className="p-5">
        <InventoryExplorer rows={rows} />
      </Card>
    </div>
  );
}
