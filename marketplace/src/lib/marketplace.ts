import { createClient } from "@/lib/supabase/server";

export interface ProductListing {
  id: string;
  name: string;
  composition: string | null;
  packSize: string | null;
  gstRate: number;
  categoryName: string | null;
  brandName: string | null;
  businessId: string;
  businessName: string;
  businessCity: string | null;
  totalStock: number;
  minPrice: number | null;
  mrp: number | null;
  createdAt: string;
}

export interface ProductSearchFilters {
  q?: string;
  category?: string;
  brand?: string;
  manufacturer?: string;
  sort?: "price_low" | "price_high" | "newest";
}

export async function searchProducts(filters: ProductSearchFilters): Promise<ProductListing[]> {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(
      "id, name, composition, pack_size, gst_rate, created_at, business_id, category_id, brand_id, manufacturer_id, businesses:business_id(name, city), categories:category_id(name), brands:brand_id(name)",
    )
    .eq("status", "active");

  if (filters.q) query = query.ilike("name", `%${filters.q}%`);
  if (filters.category) query = query.eq("category_id", filters.category);
  if (filters.brand) query = query.eq("brand_id", filters.brand);
  if (filters.manufacturer) query = query.eq("manufacturer_id", filters.manufacturer);

  query = query.order("created_at", { ascending: false }).limit(60);

  const { data: products } = await query;
  if (!products || products.length === 0) return [];

  const productIds = products.map((p) => p.id);
  const { data: batches } = await supabase
    .from("product_batches")
    .select("product_id, stock_qty, selling_price, mrp, expiry_date")
    .in("product_id", productIds)
    .gt("stock_qty", 0);

  const today = new Date().toISOString().slice(0, 10);
  const stockByProduct = new Map<string, { stock: number; minPrice: number | null; mrp: number | null }>();
  for (const b of batches ?? []) {
    if (b.expiry_date < today) continue;
    const existing = stockByProduct.get(b.product_id) ?? { stock: 0, minPrice: null, mrp: null };
    existing.stock += b.stock_qty;
    if (existing.minPrice == null || Number(b.selling_price) < existing.minPrice) {
      existing.minPrice = Number(b.selling_price);
      existing.mrp = Number(b.mrp);
    }
    stockByProduct.set(b.product_id, existing);
  }

  let listings: ProductListing[] = products.map((p: any) => ({
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
    mrp: stockByProduct.get(p.id)?.mrp ?? null,
    createdAt: p.created_at,
  }));

  if (filters.sort === "price_low") {
    listings = listings.sort((a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity));
  } else if (filters.sort === "price_high") {
    listings = listings.sort((a, b) => (b.minPrice ?? -1) - (a.minPrice ?? -1));
  }

  return listings;
}
