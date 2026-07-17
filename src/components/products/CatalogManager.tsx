"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { createCatalogEntry } from "@/app/(dashboard)/catalog/actions";
import type { Category, Brand, Manufacturer } from "@/lib/types/database";

interface CatalogManagerProps {
  categories: Category[];
  brands: Brand[];
  manufacturers: Manufacturer[];
}

function MasterList({
  table,
  items,
}: {
  table: "categories" | "brands" | "manufacturers";
  items: { id: string; name: string; is_global: boolean }[];
}) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleAdd = async () => {
    if (!value.trim()) return;
    setLoading(true);
    try {
      await createCatalogEntry(table, value);
      toast("Added successfully", "success");
      setValue("");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to add", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Add a custom entry..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button onClick={handleAdd} loading={loading}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">Nothing here yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Badge key={item.id} tone={item.is_global ? "primary" : "slate"} className="px-3 py-1.5 text-sm">
              {item.name}
              {!item.is_global && <span className="ml-1 text-[10px] text-slate-400">(custom)</span>}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function CatalogManager({ categories, brands, manufacturers }: CatalogManagerProps) {
  return (
    <Tabs
      tabs={[
        { key: "categories", label: `Categories (${categories.length})`, content: <MasterList table="categories" items={categories} /> },
        { key: "brands", label: `Brands (${brands.length})`, content: <MasterList table="brands" items={brands} /> },
        { key: "manufacturers", label: `Manufacturers (${manufacturers.length})`, content: <MasterList table="manufacturers" items={manufacturers} /> },
      ]}
    />
  );
}
