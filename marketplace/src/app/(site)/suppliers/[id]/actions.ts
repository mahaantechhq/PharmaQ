"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { fetchInChunks } from "@/lib/chunk";

export interface CatalogPageStock {
  stockByProduct: Record<string, { stock: number; minPrice: number | null; scheme: string | null }>;
  wishlistedIds: string[];
}

// Called client-side whenever the visible page of a supplier's catalog
// changes (search/filter/sort/page). Usually bounded to one page (~60
// ids), but price sorting needs the whole filtered set to order correctly
// -- chunked either way so a large set never exceeds Supabase's request
// size (the bug the original supplier-page fix addressed).
export async function getCatalogPageStock(productIds: string[]): Promise<CatalogPageStock> {
  if (productIds.length === 0) return { stockByProduct: {}, wishlistedIds: [] };

  const supabase = await createClient();
  const ctx = await getCurrentBusiness();

  const [batches, wishlistRows] = await Promise.all([
    fetchInChunks(productIds, async (chunk) => {
      const { data } = await supabase
        .from("product_batches")
        .select("product_id, stock_qty, selling_price, expiry_date, scheme")
        .in("product_id", chunk)
        .gt("stock_qty", 0);
      return data ?? [];
    }),
    ctx
      ? fetchInChunks(productIds, async (chunk) => {
          const { data } = await supabase.from("wishlist_items").select("product_id").eq("business_id", ctx.business.id).in("product_id", chunk);
          return data ?? [];
        })
      : Promise.resolve([] as { product_id: string }[]),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const stockByProduct: Record<string, { stock: number; minPrice: number | null; scheme: string | null }> = {};
  for (const b of batches ?? []) {
    if (b.expiry_date < today) continue;
    const existing = stockByProduct[b.product_id] ?? { stock: 0, minPrice: null, scheme: null };
    existing.stock += b.stock_qty;
    if (existing.minPrice == null || Number(b.selling_price) < existing.minPrice) {
      existing.minPrice = Number(b.selling_price);
      existing.scheme = b.scheme ?? null;
    }
    stockByProduct[b.product_id] = existing;
  }

  return { stockByProduct, wishlistedIds: (wishlistRows ?? []).map((w) => w.product_id) };
}
