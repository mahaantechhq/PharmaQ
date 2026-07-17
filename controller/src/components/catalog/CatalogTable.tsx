"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Globe, Building2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import {
  createCatalogItem,
  deleteCatalogItem,
  renameCatalogItem,
  toggleCatalogItemGlobal,
} from "@/app/(dashboard)/catalog/actions";

interface CatalogItem {
  id: string;
  name: string;
  is_global: boolean;
}

export function CatalogTable({ table, items }: { table: "categories" | "brands" | "manufacturers"; items: CatalogItem[] }) {
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [editValue, setEditValue] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await createCatalogItem(table, newName);
      toast("Added successfully", "success");
      setNewName("");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to add", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async () => {
    if (!editing || !editValue.trim()) return;
    setLoading(true);
    try {
      await renameCatalogItem(table, editing.id, editValue);
      toast("Updated", "success");
      setEditing(null);
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGlobal = async (item: CatalogItem) => {
    try {
      await toggleCatalogItemGlobal(table, item.id, !item.is_global);
      toast(item.is_global ? "Marked as business-only" : "Promoted to global", "success");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update", "error");
    }
  };

  const handleDelete = async (item: CatalogItem) => {
    if (!confirm(`Delete "${item.name}"? Products using it will be unassigned, not deleted.`)) return;
    try {
      await deleteCatalogItem(table, item.id);
      toast("Deleted", "success");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete", "error");
    }
  };

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Add a new entry..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button onClick={handleAdd} loading={loading}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">Nothing here yet.</p>
      ) : (
        <div className="flex flex-col divide-y divide-slate-50">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-800">{item.name}</span>
                <Badge tone={item.is_global ? "primary" : "slate"}>
                  {item.is_global ? <Globe className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                  {item.is_global ? "Global" : "Business-only"}
                </Badge>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleToggleGlobal(item)}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
                >
                  {item.is_global ? "Unpublish" : "Promote"}
                </button>
                <button
                  onClick={() => { setEditing(item); setEditValue(item.name); }}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-danger-50 hover:text-danger-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Rename entry" size="sm">
        <Field label="Name" htmlFor="edit-name">
          <Input id="edit-name" value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleRename()} />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
          <Button onClick={handleRename} loading={loading}>Save</Button>
        </div>
      </Modal>
    </div>
  );
}
