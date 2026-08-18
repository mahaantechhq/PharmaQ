import { notFound } from "next/navigation";
import { Building2, MapPin, ShieldCheck, Package, Tags, Building } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentBusiness } from "@/lib/supabase/require-business";
import { getActiveOffersByBusiness } from "@/lib/offers";
import { getLinkedWholesalerIds } from "@/lib/links";
import { SupplierStatCard } from "@/components/products/SupplierStatCard";
import { CartSidePanel } from "@/components/cart/CartSidePanel";
import { SupplierCatalog, type CatalogProduct } from "@/components/suppliers/SupplierCatalog";
import { getCatalogPageStock } from "./actions";

const PAGE_SIZE = 60;

interface SupplierProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function SupplierProfilePage({ params }: SupplierProfilePageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const ctx = await requireCurrentBusiness(`/suppliers/${id}`);

  const linkedWholesalerIds = await getLinkedWholesalerIds(ctx.business.id);
  if (!linkedWholesalerIds.includes(id)) notFound();

  // Lightweight (no product_batches join) -- this is all that's needed for
  // the category/brand breakdown and the client-side search/filter below.
  // Stock/price is fetched by the client only for whatever's actually
  // visible (see SupplierCatalog + getCatalogPageStock), not the whole
  // catalog upfront.
  const [{ data: business }, { data: products }, offersByBusiness] = await Promise.all([
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
  ]);

  if (!business) notFound();

  const offer = offersByBusiness.get(business.id) ?? null;

  const allListings: CatalogProduct[] = (products ?? []).map((p: any) => ({
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

  // Server-render the first page's stock so there's no loading flash on
  // initial load -- everything after this (typing, filtering, paging)
  // happens client-side.
  const initialPageStock = await getCatalogPageStock(allListings.slice(0, PAGE_SIZE).map((l) => l.id));

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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SupplierCatalog
          allListings={allListings}
          categories={categories}
          brands={brands}
          isLoggedIn={!!ctx}
          initialPageStock={initialPageStock}
        />

        <div className="hidden xl:block xl:sticky xl:top-20 xl:h-fit">
          <CartSidePanel />
        </div>
      </div>
    </div>
  );
}
