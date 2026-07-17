import { createClient } from "@/lib/supabase/server";
import type { ProductListing } from "@/lib/marketplace";

export interface SupplierSummary {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  productCount: number;
}

export interface HomepageStats {
  businessCount: number;
  productCount: number;
  completedOrderCount: number;
  cityCount: number;
}

async function toListings(products: any[]): Promise<ProductListing[]> {
  const supabase = await createClient();
  const productIds = products.map((p) => p.id);
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

  return products.map((p) => ({
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
}

export async function getFeaturedProducts(limit = 8): Promise<ProductListing[]> {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, composition, pack_size, gst_rate, created_at, business_id, businesses:business_id(name, city), categories:category_id(name), brands:brand_id(name)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  return toListings(products ?? []);
}

export async function getTrendingProducts(limit = 8): Promise<ProductListing[]> {
  const supabase = await createClient();
  const { data: items } = await supabase.from("supplier_order_items").select("product_id");

  const counts = new Map<string, number>();
  for (const item of items ?? []) counts.set(item.product_id, (counts.get(item.product_id) ?? 0) + 1);

  const topIds = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  if (topIds.length === 0) return getFeaturedProducts(limit);

  const { data: products } = await supabase
    .from("products")
    .select("id, name, composition, pack_size, gst_rate, created_at, business_id, businesses:business_id(name, city), categories:category_id(name), brands:brand_id(name)")
    .in("id", topIds)
    .eq("status", "active");

  return toListings(products ?? []);
}

export async function getTopSuppliers(limit = 6): Promise<SupplierSummary[]> {
  const supabase = await createClient();
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, city, state")
    .eq("status", "approved");

  const { data: products } = await supabase.from("products").select("business_id").eq("status", "active");

  const counts = new Map<string, number>();
  for (const p of products ?? []) counts.set(p.business_id, (counts.get(p.business_id) ?? 0) + 1);

  return (businesses ?? [])
    .map((b) => ({ ...b, productCount: counts.get(b.id) ?? 0 }))
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, limit);
}

export async function getHomepageStats(): Promise<HomepageStats> {
  const supabase = await createClient();

  const [{ count: businessCount }, { count: productCount }, { data: businesses }, { count: completedOrderCount }] = await Promise.all([
    supabase.from("businesses").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("businesses").select("city").eq("status", "approved"),
    supabase.from("supplier_orders").select("id", { count: "exact", head: true }).in("status", ["completed", "delivered"]),
  ]);

  const cityCount = new Set((businesses ?? []).map((b) => b.city).filter(Boolean)).size;

  return {
    businessCount: businessCount ?? 0,
    productCount: productCount ?? 0,
    completedOrderCount: completedOrderCount ?? 0,
    cityCount,
  };
}
