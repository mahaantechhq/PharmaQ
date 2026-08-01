import { createClient } from "@/lib/supabase/server";

// Sums non-expired, in-stock batch quantities for a product -- the same
// "available stock" definition used everywhere else (search results,
// product page, cart summary), so cart mutations can be validated against
// it server-side instead of trusting whatever the client last rendered.
export async function getAvailableStock(productId: string): Promise<number> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("product_batches")
    .select("stock_qty")
    .eq("product_id", productId)
    .gt("stock_qty", 0)
    .gte("expiry_date", today);

  return (data ?? []).reduce((sum, b) => sum + b.stock_qty, 0);
}
