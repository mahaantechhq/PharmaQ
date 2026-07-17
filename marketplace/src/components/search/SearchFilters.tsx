"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select } from "@/components/ui/Select";

interface FilterOption {
  id: string;
  name: string;
}

export function SearchFilters({
  categories,
  brands,
  manufacturers,
}: {
  categories: FilterOption[];
  brands: FilterOption[];
  manufacturers: FilterOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Category</p>
        <Select value={searchParams.get("category") ?? ""} onChange={(e) => updateParam("category", e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Brand</p>
        <Select value={searchParams.get("brand") ?? ""} onChange={(e) => updateParam("brand", e.target.value)}>
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </Select>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Manufacturer</p>
        <Select value={searchParams.get("manufacturer") ?? ""} onChange={(e) => updateParam("manufacturer", e.target.value)}>
          <option value="">All manufacturers</option>
          {manufacturers.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </Select>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Sort by</p>
        <Select value={searchParams.get("sort") ?? "newest"} onChange={(e) => updateParam("sort", e.target.value)}>
          <option value="newest">Newest</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
        </Select>
      </div>
    </div>
  );
}
