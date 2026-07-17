import Link from "next/link";
import { Tags } from "lucide-react";

export function CategoryGrid({ categories }: { categories: { id: string; name: string }[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h2 className="mb-6 text-xl font-semibold text-slate-900">Shop by category</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {categories.slice(0, 10).map((c) => (
          <Link
            key={c.id}
            href={`/search?category=${c.id}`}
            className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-white p-5 text-center shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <Tags className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-slate-700">{c.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
