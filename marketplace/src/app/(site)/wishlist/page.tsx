import { Heart } from "lucide-react";
import { requireCurrentBusiness } from "@/lib/supabase/require-business";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/products/ProductCard";
import type { ProductListing } from "@/lib/marketplace";

export default async function WishlistPage() {
  const ctx = await requireCurrentBusiness("/wishlist");
  const supabase = await createClient();

  const { data: items } = await supabase.from("wishlist_items").select("product_id").eq("business_id", ctx.business.id);
  const productIds = (items ?? []).map((i) => i.product_id);

  const { data: products } = productIds.length
    ? await supabase
        .from("products")
        .select("id, name, composition, pack_size, gst_rate, created_at, business_id, businesses:business_id(name, city), categories:category_id(name), brands:brand_id(name)")
        .in("id", productIds)
        .eq("status", "active")
    : { data: [] };

  const { data: batches } = productIds.length
    ? await supabase.from("product_batches").select("product_id, stock_qty, selling_price, expiry_date").in("product_id", productIds).gt("stock_qty", 0)
    : { data: [] };

  const today = new Date().toISOString().slice(0, 10);
  const stockByProduct = new Map<string, { stock: number; minPrice: number | null }>();
  for (const b of batches ?? []) {
    if (b.expiry_date < today) continue;
    const existing = stockByProduct.get(b.product_id) ?? { stock: 0, minPrice: null };
    existing.stock += b.stock_qty;
    if (existing.minPrice == null || Number(b.selling_price) < existing.minPrice) existing.minPrice = Number(b.selling_price);
    stockByProduct.set(b.product_id, existing);
  }

  const listings: ProductListing[] = (products ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    composition: p.composition,
    packSize: p.pack_size,
    gstRate: Number(p.gst_rate),
    categoryName: p.categories?.name ?? null,
    brandName: p.brands?.name ?? null,
    businessId: p.business_id,
    businessName: p.businesses?.name ?? "Unknown supplier",
    businessCity: p.businesses?.city ?? null,
    totalStock: stockByProduct.get(p.id)?.stock ?? 0,
    minPrice: stockByProduct.get(p.id)?.minPrice ?? null,
    mrp: null,
    createdAt: p.created_at,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Your wishlist</h1>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-24 text-slate-400">
          <Heart className="h-8 w-8" />
          <p className="text-sm">Nothing saved yet — tap the heart icon on any product to save it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {listings.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
