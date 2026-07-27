import Link from "next/link";
import { Building2 } from "lucide-react";

const ACCENTS = [
  "bg-primary-50 text-primary-600",
  "bg-accent-50 text-accent-600",
  "bg-success-50 text-success-600",
  "bg-info-50 text-info-500",
];

export function BrandGrid({ brands }: { brands: { id: string; name: string }[] }) {
  if (brands.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary-600">Browse</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900 sm:text-3xl">Shop by company</h2>
        </div>
        <Link href="/search" className="hidden shrink-0 text-sm font-semibold text-primary-600 hover:text-primary-700 sm:block">
          View all companies &rarr;
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {brands.slice(0, 10).map((b, i) => {
          const accent = ACCENTS[i % ACCENTS.length];
          return (
            <Link
              key={b.id}
              href={`/search?brand=${b.id}`}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110 ${accent}`}>
                <Building2 className="h-6 w-6" />
              </div>
              <span className="text-sm font-semibold text-slate-700">{b.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
