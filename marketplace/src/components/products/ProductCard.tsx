import Link from "next/link";
import { Pill, MapPin, Percent } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format";
import type { ProductListing } from "@/lib/marketplace";

function offerLabel(offer: NonNullable<ProductListing["offer"]>) {
  return offer.discountType === "percentage" ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`;
}

export function ProductCard({ product }: { product: ProductListing }) {
  const inStock = product.totalStock > 0;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <Pill className="h-8 w-8 text-primary-300" />
        {product.offer && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-accent-500 px-2 py-1 text-[10px] font-bold text-white shadow-sm">
            <Percent className="h-2.5 w-2.5" /> {offerLabel(product.offer)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="line-clamp-2 text-sm font-medium text-slate-800 group-hover:text-primary-600">{product.name}</p>
        {product.packSize && <p className="text-xs text-slate-400">{product.packSize}</p>}
        {product.offer && (
          <p className="line-clamp-1 text-xs font-medium text-accent-600">{product.offer.displayText}</p>
        )}

        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{product.businessName}</span>
        </div>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div>
            {product.minPrice != null ? (
              <p className="text-base font-semibold text-slate-900">{formatCurrency(product.minPrice)}</p>
            ) : (
              <p className="text-sm text-slate-400">Price on request</p>
            )}
          </div>
          <Badge tone={inStock ? "success" : "danger"}>{inStock ? "In stock" : "Out of stock"}</Badge>
        </div>
      </div>
    </Link>
  );
}
