import { notFound } from "next/navigation";
import Link from "next/link";
import { Pill, MapPin, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { AddToCart } from "@/components/products/AddToCart";
import { formatCurrency } from "@/lib/format";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const ctx = await getCurrentBusiness();

  const { data: product } = await supabase
    .from("products")
    .select("*, businesses:business_id(id, name, city, state), categories:category_id(name), brands:brand_id(name), manufacturers:manufacturer_id(name)")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();

  if (!product) notFound();

  const { data: batches } = await supabase
    .from("product_batches")
    .select("stock_qty, selling_price, mrp, expiry_date")
    .eq("product_id", id)
    .gt("stock_qty", 0)
    .gte("expiry_date", new Date().toISOString().slice(0, 10))
    .order("expiry_date", { ascending: true });

  const totalStock = (batches ?? []).reduce((sum, b) => sum + b.stock_qty, 0);
  const cheapest = batches?.[0];

  let wishlisted = false;
  if (ctx) {
    const { data } = await supabase
      .from("wishlist_items")
      .select("id")
      .eq("business_id", ctx.business.id)
      .eq("product_id", id)
      .maybeSingle();
    wishlisted = !!data;
  }

  const business = (product as any).businesses;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex h-80 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100">
          <Pill className="h-16 w-16 text-primary-300" />
        </div>

        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            {product.categories?.name && <Badge tone="primary">{product.categories.name}</Badge>}
            {product.brands?.name && <Badge tone="slate">{product.brands.name}</Badge>}
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">{product.name}</h1>
          {product.composition && <p className="mt-1 text-sm text-slate-500">{product.composition}</p>}

          <Link href={`/suppliers/${business.id}`} className="mt-3 flex items-center gap-1.5 text-sm text-primary-600 hover:underline">
            <MapPin className="h-4 w-4" /> Sold by {business.name} · {[business.city, business.state].filter(Boolean).join(", ")}
          </Link>

          <div className="mt-6 flex items-baseline gap-3">
            {cheapest ? (
              <>
                <span className="text-3xl font-semibold text-slate-900">{formatCurrency(Number(cheapest.selling_price))}</span>
                {Number(cheapest.mrp) > Number(cheapest.selling_price) && (
                  <span className="text-sm text-slate-400 line-through">{formatCurrency(Number(cheapest.mrp))}</span>
                )}
              </>
            ) : (
              <span className="text-lg text-slate-400">Price on request</span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">Inclusive of {Number(product.gst_rate)}% GST · {totalStock} units available</p>

          <div className="mt-6">
            <AddToCart productId={product.id} maxQty={totalStock} isLoggedIn={!!ctx} initialWishlisted={wishlisted} />
          </div>

          <Card className="mt-6">
            <CardBody className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <ShieldCheck className="h-4 w-4 text-success-500" /> Verified business on Pharma Q
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {product.pack_size && (
                  <div>
                    <dt className="text-slate-400">Pack size</dt>
                    <dd className="font-medium text-slate-700">{product.pack_size}</dd>
                  </div>
                )}
                {product.hsn_code && (
                  <div>
                    <dt className="text-slate-400">HSN code</dt>
                    <dd className="font-medium text-slate-700">{product.hsn_code}</dd>
                  </div>
                )}
                {product.manufacturers?.name && (
                  <div>
                    <dt className="text-slate-400">Manufacturer</dt>
                    <dd className="font-medium text-slate-700">{product.manufacturers.name}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-slate-400">GST rate</dt>
                  <dd className="font-medium text-slate-700">{Number(product.gst_rate)}%</dd>
                </div>
              </dl>
            </CardBody>
          </Card>
        </div>
      </div>

      {product.description && (
        <div className="mt-10">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">Description</h2>
          <p className="text-sm leading-relaxed text-slate-600">{product.description}</p>
        </div>
      )}
    </div>
  );
}
