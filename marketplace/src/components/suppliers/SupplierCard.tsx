import Link from "next/link";
import { Building2, ShieldCheck, MapPin, Package } from "lucide-react";

export interface SupplierCardData {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  productCount: number;
}

export function SupplierCard({ supplier }: { supplier: SupplierCardData }) {
  return (
    <Link
      href={`/suppliers/${supplier.id}`}
      className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-[var(--shadow-card)] transition-colors hover:border-primary-200"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
        <Building2 className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="truncate font-semibold text-slate-900">{supplier.name}</p>
          <ShieldCheck className="h-4 w-4 shrink-0 text-success-500" />
        </div>
        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {[supplier.city, supplier.state].filter(Boolean).join(", ") || "Location not specified"}
        </p>
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-slate-400">
          <Package className="h-3.5 w-3.5 shrink-0" />
          {supplier.productCount} product{supplier.productCount !== 1 ? "s" : ""}
        </p>
      </div>
    </Link>
  );
}
