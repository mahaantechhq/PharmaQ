import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Building2, MapPin, ShieldCheck, Package, Tags, Building, SearchX } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentBusiness } from "@/lib/supabase/require-business";
import { getActiveOffersByBusiness } from "@/lib/offers";
import { getLinkedWholesalerIds } from "@/lib/links";
import { fetchInChunks } from "@/lib/chunk";
import { getCartSummary } from "@/lib/checkout";
import { ProductRow } from "@/components/products/ProductRow";
import { SupplierStatCard } from "@/components/products/SupplierStatCard";
import { CartSidePanel } from "@/components/cart/CartSidePanel";
import { SearchFilters } from "@/components/search/SearchFilters";
import { SearchBox } from "@/components/search/SearchBox";
import type { ProductListing } from "@/lib/marketplace";

interface SupplierProfilePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; category?: string; brand?: string; sort?: string }>;
}

export default async function SupplierProfilePage({ params, searchParams }: SupplierProfilePageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const ctx = await requireCurrentBusiness(`/suppliers/${id}`);

  const linkedWholesalerIds = await getLinkedWholesalerIds(ctx.business.id);
  if (!linkedWholesalerIds.includes(id)) notFound();

  // None of these four depend on each other -- business.id is already
  // known to equal `id`, so offers/cartSummary don't need to wait on the
  // business row, and products doesn't either. Fire them all together
  // instead of awaiting one at a time.
  const [{ data: business }, { data: products }, offersByBusiness, cartSummary] = await Promise.all([
    supabase.from("businesses").select("*").eq("id", id).eq("status", "approved").maybeSingle(),
    supabase
      .from("products")
      .select(
        "id, name, composition, pack_size, gst_rate, created_at, business_id, category_id, brand_id, categories:category_id(name), brands:brand_id(name)",
      )
      .eq("business_id", id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    getActiveOffersByBusiness([id]),
    getCartSummary(ctx.business.id),
  ]);

  if (!business) notFound();

  const productIds = (products ?? []).map((p) => p.id);
  const [batches, wishlistRows] = await Promise.all([
    fetchInChunks(productIds, async (chunk) => {
      const { data } = await supabase
        .from("product_batches")
        .select("product_id, stock_qty, selling_price, expiry_date")
        .in("product_id", chunk)
        .gt("stock_qty", 0);
      return data ?? [];
    }),
    ctx
      ? fetchInChunks(productIds, async (chunk) => {
          const { data } = await supabase
            .from("wishlist_items")
            .select("product_id")
            .eq("business_id", ctx.business.id)
            .in("product_id", chunk);
          return data ?? [];
        })
      : Promise.resolve([] as { product_id: string }[]),
  ]);
  const wishlistedIds = new Set(wishlistRows.map((w) => w.product_id));

  const today = new Date().toISOString().slice(0, 10);
  const stockByProduct = new Map<string, { stock: number; minPrice: number | null }>();
  for (const b of batches ?? []) {
    if (b.expiry_date < today) continue;
    const existing = stockByProduct.get(b.product_id) ?? { stock: 0, minPrice: null };
    existing.stock += b.stock_qty;
    if (existing.minPrice == null || Number(b.selling_price) < existing.minPrice) existing.minPrice = Number(b.selling_price);
    stockByProduct.set(b.product_id, existing);
  }

  const offer = offersByBusiness.get(business.id) ?? null;

  type SupplierProductListing = ProductListing & { categoryId: string | null; brandId: string | null };

  const allListings: SupplierProductListing[] = (products ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    composition: p.composition,
    packSize: p.pack_size,
    gstRate: Number(p.gst_rate),
    categoryId: p.category_id as string | null,
    brandId: p.brand_id as string | null,
    categoryName: p.categories?.name ?? null,
    brandName: p.brands?.name ?? null,
    businessId: business.id,
    businessName: business.name,
    businessCity: business.city,
    totalStock: stockByProduct.get(p.id)?.stock ?? 0,
    minPrice: stockByProduct.get(p.id)?.minPrice ?? null,
    mrp: null,
    createdAt: p.created_at,
    offer,
  }));

  const countByName = (names: (string | null)[]) => {
    const counts = new Map<string, number>();
    for (const name of names) {
      if (!name) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  const categoryBreakdown = countByName(allListings.map((l) => l.categoryName));
  const companyBreakdown = countByName(allListings.map((l) => l.brandName));

  const categories = Array.from(new Map(allListings.filter((l) => l.categoryId).map((l) => [l.categoryId!, l.categoryName!])))
    .map(([idValue, name]) => ({ id: idValue, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const brands = Array.from(new Map(allListings.filter((l) => l.brandId).map((l) => [l.brandId!, l.brandName!])))
    .map(([idValue, name]) => ({ id: idValue, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  let listings = allListings.filter((l) => {
    if (query.q && !l.name.toLowerCase().includes(query.q.toLowerCase())) return false;
    if (query.category && l.categoryId !== query.category) return false;
    if (query.brand && l.brandId !== query.brand) return false;
    return true;
  });

  if (query.sort === "price_low") {
    listings = [...listings].sort((a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity));
  } else if (query.sort === "price_high") {
    listings = [...listings].sort((a, b) => (b.minPrice ?? -1) - (a.minPrice ?? -1));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-[var(--shadow-card)]">
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
          {offer && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-600">
              {offer.discountType === "percentage" ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`} — {offer.displayText}
            </p>
          )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-[var(--shadow-card)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total products</p>
            <p className="mt-0.5 text-xl font-semibold text-slate-900">{allListings.length}</p>
          </div>
        </div>
        <SupplierStatCard
          label="Categories"
          icon={<Tags className="h-5 w-5" />}
          tone="success"
          value={categoryBreakdown.length}
          items={categoryBreakdown}
        />
        <SupplierStatCard
          label="Companies"
          icon={<Building className="h-5 w-5" />}
          tone="warning"
          value={companyBreakdown.length}
          items={companyBreakdown}
        />
      </div>

      <div className="mb-6">
        <Suspense>
          <SearchBox isLoggedIn={!!ctx} />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr] xl:grid-cols-[240px_1fr_320px]">
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <Suspense>
            <SearchFilters categories={categories} brands={brands} />
          </Suspense>
        </aside>

        {allListings.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-400">This supplier hasn&apos;t listed any products yet.</p>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-white py-24 text-slate-400">
            <SearchX className="h-8 w-8" />
            <p className="text-sm">No products found. Try a different search or filter.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
            {listings.map((p) => (
              <ProductRow key={p.id} product={p} isLoggedIn={!!ctx} initialWishlisted={wishlistedIds.has(p.id)} query={query.q} />
            ))}
          </div>
        )}

        <div className="hidden xl:block xl:sticky xl:top-20 xl:h-fit">
          <CartSidePanel summary={cartSummary} />
        </div>
      </div>
    </div>
  );
}
