import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { getCartSummary } from "@/lib/checkout";
import { searchProducts } from "@/lib/marketplace";
import { ProductRow } from "@/components/products/ProductRow";
import { CartSidePanel } from "@/components/cart/CartSidePanel";
import { SearchFilters } from "@/components/search/SearchFilters";
import { SearchBox } from "@/components/search/SearchBox";

interface SearchPageProps {
  searchParams: Promise<{ q?: string; category?: string; brand?: string; manufacturer?: string; sort?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const ctx = await getCurrentBusiness();

  const [{ data: categories }, { data: brands }, { data: manufacturers }, products] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("brands").select("id, name").order("name"),
    supabase.from("manufacturers").select("id, name").order("name"),
    searchProducts({
      q: params.q,
      category: params.category,
      brand: params.brand,
      manufacturer: params.manufacturer,
      sort: (params.sort as "price_low" | "price_high" | "newest") ?? "newest",
    }),
  ]);

  let wishlistedIds = new Set<string>();
  let cartSummary = null;
  if (ctx) {
    const productIds = products.map((p) => p.id);
    const [{ data: wishlistRows }, summary] = await Promise.all([
      productIds.length
        ? supabase.from("wishlist_items").select("product_id").eq("business_id", ctx.business.id).in("product_id", productIds)
        : Promise.resolve({ data: [] as { product_id: string }[] }),
      getCartSummary(ctx.business.id),
    ]);
    wishlistedIds = new Set((wishlistRows ?? []).map((w) => w.product_id));
    cartSummary = summary;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {params.q ? `Results for "${params.q}"` : "All products"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {products.length} listing{products.length !== 1 && "s"} from independent suppliers
          </p>
        </div>
        <div className="relative left-[-700px] w-full sm:w-[calc(24rem+70px)] sm:max-w-none">
          <Suspense>
            <SearchBox />
          </Suspense>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]${cartSummary ? " xl:grid-cols-[240px_1fr_320px]" : ""}`}>
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <Suspense>
            <SearchFilters
              categories={categories ?? []}
              brands={brands ?? []}
              manufacturers={manufacturers ?? []}
            />
          </Suspense>
        </aside>

        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
          {products.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-24 text-slate-400">
              <SearchX className="h-8 w-8" />
              <p className="text-sm">No products found. Try a different search or filter.</p>
            </div>
          ) : (
            products.map((p) => (
              <ProductRow key={p.id} product={p} isLoggedIn={!!ctx} initialWishlisted={wishlistedIds.has(p.id)} />
            ))
          )}
        </div>

        {cartSummary && (
          <div className="hidden xl:block xl:sticky xl:top-20 xl:h-fit">
            <CartSidePanel summary={cartSummary} />
          </div>
        )}
      </div>
    </div>
  );
}
