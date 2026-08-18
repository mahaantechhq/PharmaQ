import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, MapPin, ShieldCheck, Package, Tags, Building, SearchX, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentBusiness } from "@/lib/supabase/require-business";
import { getActiveOffersByBusiness } from "@/lib/offers";
import { getLinkedWholesalerIds } from "@/lib/links";
import { getCartSummary } from "@/lib/checkout";
import { fetchInChunks } from "@/lib/chunk";
import { ProductRow } from "@/components/products/ProductRow";
import { SupplierStatCard } from "@/components/products/SupplierStatCard";
import { CartSidePanel } from "@/components/cart/CartSidePanel";
import { SearchFilters } from "@/components/search/SearchFilters";
import { SearchBox } from "@/components/search/SearchBox";
import type { ProductListing } from "@/lib/marketplace";

const PAGE_SIZE = 60;

interface SupplierProfilePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; category?: string; brand?: string; sort?: string; page?: string }>;
}

export default async function SupplierProfilePage({ params, searchParams }: SupplierProfilePageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const ctx = await requireCurrentBusiness(`/suppliers/${id}`);

  const linkedWholesalerIds = await getLinkedWholesalerIds(ctx.business.id);
  if (!linkedWholesalerIds.includes(id)) notFound();

  // Lightweight (no product_batches join) -- this alone is what's needed
  // for the category/brand breakdown, filter dropdown options, and name
  // search. Computing stock/price for every product is the expensive part
  // (a chunked query across all of them), so that's deferred to only the
  // current page's results below instead of the whole catalog.
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
    totalStock: 0,
    minPrice: null,
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

  const filtered = allListings.filter((l) => {
    if (query.q && !l.name.toLowerCase().includes(query.q.toLowerCase())) return false;
    if (query.category && l.categoryId !== query.category) return false;
    if (query.brand && l.brandId !== query.brand) return false;
    return true;
  });

  // Price sorting needs stock/price for the whole filtered set (not just
  // one page) to sort correctly -- an explicit opt-in the user chose, so
  // the extra cost only applies then. The default "newest" view (what a
  // freshly-clicked supplier page lands on) never pays for more than one
  // page's worth of stock lookups.
  const needsFullStock = query.sort === "price_low" || query.sort === "price_high";

  const currentPage = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  let pageItems: SupplierProductListing[];
  let stockTargetIds: string[];

  if (needsFullStock) {
    const stockByProduct = await getStockByProduct(supabase, filtered.map((l) => l.id));
    const sorted = [...filtered].sort((a, b) => {
      const aPrice = stockByProduct.get(a.id)?.minPrice ?? (query.sort === "price_low" ? Infinity : -1);
      const bPrice = stockByProduct.get(b.id)?.minPrice ?? (query.sort === "price_low" ? Infinity : -1);
      return query.sort === "price_low" ? aPrice - bPrice : bPrice - aPrice;
    });
    pageItems = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    for (const p of pageItems) {
      const stock = stockByProduct.get(p.id);
      p.totalStock = stock?.stock ?? 0;
      p.minPrice = stock?.minPrice ?? null;
    }
    stockTargetIds = [];
  } else {
    pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    stockTargetIds = pageItems.map((p) => p.id);
  }

  const [stockByProduct, wishlistRows] = await Promise.all([
    stockTargetIds.length ? getStockByProduct(supabase, stockTargetIds) : Promise.resolve(new Map()),
    stockTargetIds.length
      ? supabase
          .from("wishlist_items")
          .select("product_id")
          .eq("business_id", ctx.business.id)
          .in("product_id", stockTargetIds)
          .then((r) => r.data ?? [])
      : Promise.resolve([] as { product_id: string }[]),
  ]);

  if (!needsFullStock) {
    for (const p of pageItems) {
      const stock = stockByProduct.get(p.id) as { stock: number; minPrice: number | null } | undefined;
      p.totalStock = stock?.stock ?? 0;
      p.minPrice = stock?.minPrice ?? null;
    }
  }

  const wishlistedIds = new Set(wishlistRows.map((w) => w.product_id));

  const pageQueryString = (page: number) => {
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    if (query.category) params.set("category", query.category);
    if (query.brand) params.set("brand", query.brand);
    if (query.sort) params.set("sort", query.sort);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  };

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr] xl:grid-cols-[240px_1fr_320px]">
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <Suspense>
            <SearchFilters categories={categories} brands={brands} />
          </Suspense>
        </aside>

        <div className="flex flex-col gap-6">
          <Suspense>
            <SearchBox isLoggedIn={!!ctx} />
          </Suspense>

          {allListings.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-400">This supplier hasn&apos;t listed any products yet.</p>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-white py-24 text-slate-400">
              <SearchX className="h-8 w-8" />
              <p className="text-sm">No products found. Try a different search or filter.</p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
                {pageItems.map((p) => (
                  <ProductRow key={p.id} product={p} isLoggedIn={!!ctx} initialWishlisted={wishlistedIds.has(p.id)} query={query.q} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>
                    Page {currentPage} of {totalPages} · {filtered.length} products
                  </span>
                  <div className="flex gap-2">
                    <Link
                      href={pageQueryString(currentPage - 1) || "?"}
                      aria-disabled={currentPage <= 1}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 ${currentPage <= 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-50"}`}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Link>
                    <Link
                      href={pageQueryString(currentPage + 1)}
                      aria-disabled={currentPage >= totalPages}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 ${currentPage >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-slate-50"}`}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="hidden xl:block xl:sticky xl:top-20 xl:h-fit">
          <CartSidePanel summary={cartSummary} />
        </div>
      </div>
    </div>
  );
}

async function getStockByProduct(supabase: Awaited<ReturnType<typeof createClient>>, productIds: string[]) {
  const stockByProduct = new Map<string, { stock: number; minPrice: number | null }>();
  if (productIds.length === 0) return stockByProduct;

  // Chunked because this can be called with the full filtered set (price
  // sort needs every product's price to sort correctly) -- for a supplier
  // with hundreds of products, a single .in() with all of them exceeds
  // Supabase/PostgREST's request size and fails outright.
  const batches = await fetchInChunks(productIds, async (chunk) => {
    const { data } = await supabase
      .from("product_batches")
      .select("product_id, stock_qty, selling_price, expiry_date")
      .in("product_id", chunk)
      .gt("stock_qty", 0);
    return data ?? [];
  });

  const today = new Date().toISOString().slice(0, 10);
  for (const b of batches ?? []) {
    if (b.expiry_date < today) continue;
    const existing = stockByProduct.get(b.product_id) ?? { stock: 0, minPrice: null };
    existing.stock += b.stock_qty;
    if (existing.minPrice == null || Number(b.selling_price) < existing.minPrice) existing.minPrice = Number(b.selling_price);
    stockByProduct.set(b.product_id, existing);
  }
  return stockByProduct;
}
