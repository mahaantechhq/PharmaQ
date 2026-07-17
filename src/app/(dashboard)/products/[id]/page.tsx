import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { getCatalogMasters } from "@/lib/supabase/catalog";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { ProductForm } from "@/components/products/ProductForm";
import { BatchTable } from "@/components/products/BatchTable";
import type { ProductBatch } from "@/lib/types/database";

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

  return (
    <div>
      <PageHeader title={product.name} description="Manage product details and batch inventory." />

      <Card>
        <CardBody>
          <Tabs
            tabs={[
              {
                key: "details",
                label: "Details",
                content: (
                  <ProductForm
                    productId={product.id}
                    defaultValues={{
                      name: product.name,
                      category_id: product.category_id ?? "",
                      brand_id: product.brand_id ?? "",
                      manufacturer_id: product.manufacturer_id ?? "",
                      composition: product.composition ?? "",
                      pack_size: product.pack_size ?? "",
                      hsn_code: product.hsn_code ?? "",
                      gst_rate: Number(product.gst_rate),
                      description: product.description ?? "",
                      status: product.status,
                    }}
                    categories={catalog.categories}
                    brands={catalog.brands}
                    manufacturers={catalog.manufacturers}
                  />
                ),
              },
              {
                key: "batches",
                label: `Batches (${batches?.length ?? 0})`,
                content: <BatchTable productId={product.id} batches={(batches ?? []) as ProductBatch[]} />,
              },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  );
}
