"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { updateBusinessOwnerName } from "@/app/(dashboard)/businesses/actions";
import type { BusinessOwner } from "@/lib/types/database";

export function BusinessOwnerForm({ businessId, owner }: { businessId: string; owner: BusinessOwner }) {
  const [name, setName] = useState(owner.full_name);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateBusinessOwnerName(businessId, owner.id, name);
      toast("Owner name updated", "success");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update owner name", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="Owner name" htmlFor="owner_full_name" required>
        <Input id="owner_full_name" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <div className="flex justify-end border-t border-slate-100 pt-5">
        <Button type="submit" loading={loading}>Save changes</Button>
      </div>
    </form>
  );
}
