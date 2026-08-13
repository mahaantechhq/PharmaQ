import { Suspense } from "react";
import { SearchX, Link2Off } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentBusiness } from "@/lib/supabase/require-business";
import { getCartSummary } from "@/lib/checkout";
import { getLinkedWholesalerIds } from "@/lib/links";
import { CartSidePanel } from "@/components/cart/CartSidePanel";
import { SearchBox } from "@/components/search/SearchBox";
import { SupplierCard, type SupplierCardData } from "@/components/suppliers/SupplierCard";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const ctx = await requireCurrentBusiness("/search");
  const linkedWholesalerIds = await getLinkedWholesalerIds(ctx.business.id);

  // Doesn't depend on the supplier results, so fire it off now instead of
  // waiting until after the businesses query below resolves.
  const cartSummaryPromise = getCartSummary(ctx.business.id);

  const businessesPromise = (async () => {
    if (linkedWholesalerIds.length === 0) return { data: [] as { id: string; name: string; city: string | null; state: string | null }[] };
    let query = supabase.from("businesses").select("id, name, city, state").eq("status", "approved").in("id", linkedWholesalerIds).order("name");
    if (params.q) query = query.ilike("name", `%${params.q}%`);
    return query;
  })();

  const [{ data: businesses }, cartSummary] = await Promise.all([businessesPromise, cartSummaryPromise]);

  const businessIds = (businesses ?? []).map((b) => b.id);
  const { data: activeProducts } = businessIds.length
    ? await supabase.from("products").select("business_id").in("business_id", businessIds).eq("status", "active")
    : { data: [] as { business_id: string }[] };

  const productCountByBusiness = new Map<string, number>();
  for (const p of activeProducts ?? []) {
    productCountByBusiness.set(p.business_id, (productCountByBusiness.get(p.business_id) ?? 0) + 1);
  }

  const suppliers: SupplierCardData[] = (businesses ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    city: b.city,
    state: b.state,
    productCount: productCountByBusiness.get(b.id) ?? 0,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {params.q ? `Suppliers matching "${params.q}"` : "Your suppliers"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {suppliers.length} supplier{suppliers.length !== 1 ? "s" : ""} you&apos;re linked to
          </p>
        </div>
        <div className="w-full sm:max-w-md">
          <Suspense>
            <SearchBox isLoggedIn={!!ctx} />
          </Suspense>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        {linkedWholesalerIds.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-white py-24 text-center text-slate-400">
            <Link2Off className="h-8 w-8" />
            <p className="max-w-xs text-sm">
              You&apos;re not linked to any wholesaler yet. Contact Pharma Q support to get connected.
            </p>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-white py-24 text-slate-400">
            <SearchX className="h-8 w-8" />
            <p className="text-sm">No suppliers found. Try a different search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suppliers.map((s) => (
              <SupplierCard key={s.id} supplier={s} />
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
