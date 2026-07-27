import Link from "next/link";
import { Plus, Upload, Package, Tag, Award } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/dashboard/StatCard";
import { CatalogStatCard } from "@/components/products/CatalogStatCard";
import { ProductsExplorer, type ProductRow } from "@/components/products/ProductsExplorer";
import { formatNumber } from "@/lib/format";

export default async function ProductsPage() {
  const ctx = await getCurrentBusiness();
  if (!ctx) return null;

  const supabase = await createClient();

  const [{ data: products }, { data: batches }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, status, composition, pack_size, hsn_code, gst_rate, categories(name), brands(name)")
      .eq("business_id", ctx.business.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("product_batches")
      .select("product_id, batch_number, expiry_date, mrp, selling_price, scheme, discount_percent, stock_qty")
      .eq("business_id", ctx.business.id)
      .order("expiry_date", { ascending: true }),
  ]);

  // A product can have several batches (restocks). The soonest-expiring one
  // represents the product's displayed batch details (what FIFO sells
  // first), but Stock must sum every non-expired batch or restocked
  // quantity silently disappears from this list.
  const today = new Date().toISOString().slice(0, 10);
  const primaryBatchByProduct = new Map<string, any>();
  const stockByProduct = new Map<string, number>();
  for (const b of (batches ?? []) as any[]) {
    if (!primaryBatchByProduct.has(b.product_id)) primaryBatchByProduct.set(b.product_id, b);
    if (b.expiry_date >= today) {
      stockByProduct.set(b.product_id, (stockByProduct.get(b.product_id) ?? 0) + b.stock_qty);
    }
  }

  const rows: ProductRow[] = (products ?? []).map((p: any) => {
    const batch = primaryBatchByProduct.get(p.id);
    return {
      id: p.id,
      name: p.name,
      categoryName: p.categories?.name ?? null,
      brandName: p.brands?.name ?? null,
      composition: p.composition,
      packSize: p.pack_size,
      hsnCode: p.hsn_code,
      gstRate: Number(p.gst_rate),
      status: p.status,
      batchNumber: batch?.batch_number ?? null,
      expiryDate: batch?.expiry_date ?? null,
      mrp: batch ? Number(batch.mrp) : null,
      sellingPrice: batch ? Number(batch.selling_price) : null,
      scheme: batch?.scheme ?? null,
      discountPercent: batch?.discount_percent != null ? Number(batch.discount_percent) : null,
      stockQty: stockByProduct.get(p.id) ?? 0,
    };
  });

  const countByName = (names: (string | null)[]) => {
    const counts = new Map<string, number>();
    for (const name of names) {
      if (!name) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  const categoryBreakdown = countByName(rows.map((r) => r.categoryName));
  const companyBreakdown = countByName(rows.map((r) => r.brandName));

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

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total products" value={formatNumber(rows.length)} icon={Package} />
        <CatalogStatCard label="Categories" icon={<Tag className="h-5 w-5" />} tone="success" items={categoryBreakdown} />
        <CatalogStatCard label="Company" icon={<Award className="h-5 w-5" />} tone="warning" items={companyBreakdown} />
      </div>

      <Card className="p-5">
        <ProductsExplorer products={rows} />
      </Card>
    </div>
  );
}
