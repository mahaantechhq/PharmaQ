import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { CatalogManager } from "@/components/products/CatalogManager";
import { getCatalogMasters } from "@/lib/supabase/catalog";

export default async function CatalogPage() {
  const { categories, brands, manufacturers } = await getCatalogMasters();

  return (
    <div>
      <PageHeader
        title="Categories & Brands"
        description="Browse the platform's shared taxonomy, or add entries specific to your business."
      />
      <Card>
        <CardBody>
          <CatalogManager categories={categories} brands={brands} manufacturers={manufacturers} />
        </CardBody>
      </Card>
    </div>
  );
}
