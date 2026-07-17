import Link from "next/link";
import { Building2, MapPin } from "lucide-react";
import type { SupplierSummary } from "@/lib/homepage";

export function TopSuppliers({ suppliers }: { suppliers: SupplierSummary[] }) {
  if (suppliers.length === 0) return null;

  return (
    <section className="bg-slate-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="mb-6 text-xl font-semibold text-slate-900">Top suppliers</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => (
            <Link
              key={s.id}
              href={`/suppliers/${s.id}`}
              className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">{s.name}</p>
                <p className="flex items-center gap-1 text-xs text-slate-400">
                  <MapPin className="h-3 w-3" /> {[s.city, s.state].filter(Boolean).join(", ") || "India"}
                </p>
                <p className="mt-1 text-xs text-primary-600">{s.productCount} products</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
