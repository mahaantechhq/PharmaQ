import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProductsExplorer, type ProductRow } from "@/components/products/ProductsExplorer";

export default async function ProductsPage() {
  const ctx = await getCurrentBusiness();
  if (!ctx) return null;

  const supabase = await createClient();

  const [{ data: products }, { data: batches }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, status, pack_size, categories(name), brands(name)")
      .eq("business_id", ctx.business.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("product_batches")
      .select("product_id, stock_qty, selling_price")
      .eq("business_id", ctx.business.id),
  ]);

  const stockByProduct = new Map<string, { stock: number; minPrice: number | null }>();
  for (const b of batches ?? []) {
    const existing = stockByProduct.get(b.product_id) ?? { stock: 0, minPrice: null };
    existing.stock += b.stock_qty;
    if (b.stock_qty > 0) {
      existing.minPrice = existing.minPrice == null ? Number(b.selling_price) : Math.min(existing.minPrice, Number(b.selling_price));
    }
    stockByProduct.set(b.product_id, existing);
  }

  const rows: ProductRow[] = (products ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    categoryName: p.categories?.name ?? null,
    brandName: p.brands?.name ?? null,
    packSize: p.pack_size,
    status: p.status,
    totalStock: stockByProduct.get(p.id)?.stock ?? 0,
    minPrice: stockByProduct.get(p.id)?.minPrice ?? null,
  }));

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage the products your business lists on Pharma Q."
        action={
          <div className="flex gap-2">
            <Link href="/products/bulk-upload">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4" /> Bulk upload
              </Button>
            </Link>
            <Link href="/products/new">
              <Button size="sm">
                <Plus className="h-4 w-4" /> Add product
              </Button>
            </Link>
          </div>
        }
      />

      <Card className="p-5">
        <ProductsExplorer products={rows} />
      </Card>
    </div>
  );
}
