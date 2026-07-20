import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { searchProducts } from "@/lib/marketplace";
import { ProductCard } from "@/components/products/ProductCard";
import { SearchFilters } from "@/components/search/SearchFilters";
import { SearchBox } from "@/components/search/SearchBox";

interface SearchPageProps {
  searchParams: Promise<{ q?: string; category?: string; brand?: string; manufacturer?: string; sort?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          {params.q ? `Results for "${params.q}"` : "All products"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {products.length} listing{products.length !== 1 && "s"} from independent suppliers
        </p>
        <div className="mt-4 max-w-xl">
          <Suspense>
            <SearchBox />
          </Suspense>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <Suspense>
            <SearchFilters
              categories={categories ?? []}
              brands={brands ?? []}
              manufacturers={manufacturers ?? []}
            />
          </Suspense>
        </aside>

        <div>
          {products.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-24 text-slate-400">
              <SearchX className="h-8 w-8" />
              <p className="text-sm">No products found. Try a different search or filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
