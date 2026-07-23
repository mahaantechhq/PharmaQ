import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { getCatalogMasters } from "@/lib/supabase/catalog";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { ProductForm } from "@/components/products/ProductForm";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getCurrentBusiness();
  if (!ctx) return null;

  const supabase = await createClient();

  const [{ data: product }, { data: batches }, catalog] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).eq("business_id", ctx.business.id).single(),
    supabase
      .from("product_batches")
      .select("*")
      .eq("product_id", id)
      .eq("business_id", ctx.business.id)
      .order("expiry_date", { ascending: true }),
    getCatalogMasters(),
  ]);

  if (!product) notFound();

  const batch = batches?.[0];

  return (
    <div>
      <PageHeader title={product.name} description="Manage product details, stock and pricing." />

      <Card>
        <CardBody>
          <ProductForm
            productId={product.id}
            batchId={batch?.id}
            defaultValues={{
              name: product.name,
              category_id: product.category_id ?? "",
              brand_id: product.brand_id ?? "",
              manufacturer_id: product.manufacturer_id ?? "",
              composition: product.composition ?? "",
              pack_size: product.pack_size ?? "",
              hsn_code: product.hsn_code ?? "",
              gst_rate: Number(product.gst_rate),
              status: product.status,
              batch_number: batch?.batch_number ?? "",
              mfg_date: batch?.mfg_date ?? "",
              expiry_date: batch?.expiry_date ?? "",
              mrp: batch ? Number(batch.mrp) : undefined,
              selling_price: batch ? Number(batch.selling_price) : undefined,
              scheme: batch?.scheme ?? "",
              discount_percent: batch?.discount_percent != null ? Number(batch.discount_percent) : undefined,
              stock_qty: batch ? batch.stock_qty : 0,
            }}
            categories={catalog.categories}
            brands={catalog.brands}
            manufacturers={catalog.manufacturers}
          />
        </CardBody>
      </Card>
    </div>
  );
}
