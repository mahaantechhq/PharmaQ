import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { ProductForm } from "@/components/products/ProductForm";
import { getCatalogMasters } from "@/lib/supabase/catalog";

export default async function NewProductPage() {
  const { categories, brands } = await getCatalogMasters();

  return (
    <div>
      <PageHeader title="Add product" description="List a new product to your storefront." />
      <Card>
        <CardBody>
          <ProductForm categories={categories} brands={brands} />
        </CardBody>
      </Card>
    </div>
  );
}
