import { notFound } from "next/navigation";
import { Building2, MapPin, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/products/ProductCard";
import type { ProductListing } from "@/lib/marketplace";

export default async function SupplierProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (!business) notFound();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, composition, pack_size, gst_rate, created_at, business_id, categories:category_id(name), brands:brand_id(name)")
    .eq("business_id", id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const productIds = (products ?? []).map((p) => p.id);
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
    businessId: business.id,
    businessName: business.name,
    businessCity: business.city,
    totalStock: stockByProduct.get(p.id)?.stock ?? 0,
    minPrice: stockByProduct.get(p.id)?.minPrice ?? null,
    mrp: null,
    createdAt: p.created_at,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <Building2 className="h-8 w-8" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900">{business.name}</h1>
            <ShieldCheck className="h-4 w-4 text-success-500" />
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin className="h-3.5 w-3.5" /> {[business.city, business.state].filter(Boolean).join(", ") || "Location not specified"}
          </p>
          <p className="mt-2 text-sm text-slate-500">{listings.length} products listed</p>
        </div>
      </div>

      {listings.length === 0 ? (
        <p className="py-16 text-center text-sm text-slate-400">This supplier hasn&apos;t listed any products yet.</p>
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
