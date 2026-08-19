"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, SearchX, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { ProductRow } from "@/components/products/ProductRow";
import { getCatalogPageStock, type CatalogPageStock } from "@/app/(site)/suppliers/[id]/actions";
import type { ProductListing } from "@/lib/marketplace";

export type CatalogProduct = ProductListing & { categoryId: string | null; brandId: string | null };

const PAGE_SIZE = 60;
const DEBOUNCE_MS = 250;

export function SupplierCatalog({
  allListings,
  categories,
  brands,
  isLoggedIn,
  initialPageStock,
}: {
  allListings: CatalogProduct[];
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  isLoggedIn: boolean;
  initialPageStock: CatalogPageStock;
}) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [sort, setSort] = useState<"newest" | "price_low" | "price_high">("newest");
  const [page, setPage] = useState(1);
  const [stockByProduct, setStockByProduct] = useState(initialPageStock.stockByProduct);
  const [wishlistedIds, setWishlistedIds] = useState(new Set(initialPageStock.wishlistedIds));
  const [loadingStock, setLoadingStock] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filtering runs entirely in the browser against the already-loaded
  // catalog -- no network round trip, so it's instant on every keystroke.
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return allListings.filter((l) => {
      if (needle && !l.name.toLowerCase().includes(needle)) return false;
      if (category && l.categoryId !== category) return false;
      if (brand && l.brandId !== brand) return false;
      return true;
    });
  }, [allListings, q, category, brand]);

  const needsFullStock = sort === "price_low" || sort === "price_high";

  const sorted = useMemo(() => {
    if (!needsFullStock) return filtered;
    return [...filtered].sort((a, b) => {
      const aPrice = stockByProduct[a.id]?.minPrice ?? (sort === "price_low" ? Infinity : -1);
      const bPrice = stockByProduct[b.id]?.minPrice ?? (sort === "price_low" ? Infinity : -1);
      return sort === "price_low" ? aPrice - bPrice : bPrice - aPrice;
    });
  }, [filtered, needsFullStock, sort, stockByProduct]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset to page 1 whenever the filter set changes underneath the user.
  useEffect(() => {
    setPage(1);
  }, [q, category, brand, sort]);

  // Only stock/price/wishlist status needs a server round trip -- debounced
  // so rapid typing doesn't fire a request per keystroke, and only for
  // whatever's actually going to be shown (one page, or the whole filtered
  // set when price-sorting needs it to order correctly).
  useEffect(() => {
    const targetIds = needsFullStock ? sorted.map((p) => p.id) : pageItems.map((p) => p.id);
    const missing = targetIds.filter((id) => !(id in stockByProduct));
    if (missing.length === 0) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoadingStock(true);
      getCatalogPageStock(missing)
        .then((result) => {
          setStockByProduct((prev) => ({ ...prev, ...result.stockByProduct }));
          setWishlistedIds((prev) => {
            const next = new Set(prev);
            for (const id of result.wishlistedIds) next.add(id);
            return next;
          });
        })
        .finally(() => setLoadingStock(false));
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, category, brand, sort, currentPage]);

  const displayItems = pageItems.map((p) => ({
    ...p,
    totalStock: stockByProduct[p.id]?.stock ?? 0,
    minPrice: stockByProduct[p.id]?.minPrice ?? null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[var(--shadow-card)]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search this supplier's products..."
            className="h-10 w-full rounded-lg pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
        </div>
        <div className="flex shrink-0 gap-2">
          <Select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 w-32 text-xs">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Select value={brand} onChange={(e) => setBrand(e.target.value)} className="h-10 w-32 text-xs">
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-10 w-36 text-xs">
            <option value="newest">Newest</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </Select>
        </div>
      </div>

      {allListings.length === 0 ? (
        <p className="py-16 text-center text-sm text-slate-400">This supplier hasn&apos;t listed any products yet.</p>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-white py-24 text-slate-400">
          <SearchX className="h-8 w-8" />
          <p className="text-sm">No products found. Try a different search or filter.</p>
        </div>
      ) : (
        <>
          <div className={`overflow-hidden rounded-xl border border-slate-100 bg-white transition-opacity ${loadingStock ? "opacity-60" : ""}`}>
            {displayItems.map((p) => (
              <ProductRow key={p.id} product={p} isLoggedIn={isLoggedIn} initialWishlisted={wishlistedIds.has(p.id)} query={q} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span className="flex items-center gap-2">
                {loadingStock && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-400" />}
                Page {currentPage} of {totalPages} · {sorted.length} products
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
