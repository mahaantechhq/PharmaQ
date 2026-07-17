import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { CatalogTable } from "@/components/catalog/CatalogTable";

export default async function CatalogPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: brands }, { data: manufacturers }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("brands").select("*").order("name"),
    supabase.from("manufacturers").select("*").order("name"),
  ]);

  return (
    <div>
      <PageHeader title="Catalog" description="Manage the shared taxonomy every business's products draw from." />
      <Card>
        <CardBody>
          <Tabs
            tabs={[
              { key: "categories", label: `Categories (${categories?.length ?? 0})`, content: <CatalogTable table="categories" items={categories ?? []} /> },
              { key: "brands", label: `Brands (${brands?.length ?? 0})`, content: <CatalogTable table="brands" items={brands ?? []} /> },
              { key: "manufacturers", label: `Manufacturers (${manufacturers?.length ?? 0})`, content: <CatalogTable table="manufacturers" items={manufacturers ?? []} /> },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  );
}
