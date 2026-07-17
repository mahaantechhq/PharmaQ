import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BusinessesExplorer } from "@/components/businesses/BusinessesExplorer";
import type { Business } from "@/lib/types/database";

export default async function BusinessesPage() {
  const supabase = await createClient();
  const { data: businesses } = await supabase.from("businesses").select("*").order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Businesses"
        description="Every business registered on Pharma Q — both buyers and sellers."
        action={
          <Link href="/businesses/new">
            <Button size="sm">
              <Plus className="h-4 w-4" /> Create business
            </Button>
          </Link>
        }
      />
      <Card className="p-5">
        <BusinessesExplorer businesses={(businesses ?? []) as Business[]} />
      </Card>
    </div>
  );
}
