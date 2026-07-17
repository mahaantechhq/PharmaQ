"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { differenceInCalendarDays, format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { batchSchema, type BatchFormValues } from "@/lib/validations/product";
import { addBatch, deleteBatch } from "@/app/(dashboard)/products/actions";
import { formatCurrency } from "@/lib/format";
import type { ProductBatch } from "@/lib/types/database";

function expiryTone(days: number): "danger" | "warning" | "success" {
  if (days < 0) return "danger";
  if (days <= 30) return "warning";
  return "success";
}

export function BatchTable({ productId, batches }: { productId: string; batches: ProductBatch[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const sorted = [...batches].sort((a, b) => a.expiry_date.localeCompare(b.expiry_date));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BatchFormValues>({ resolver: zodResolver(batchSchema) });

  const onSubmit = async (values: BatchFormValues) => {
    try {
      await addBatch(productId, values);
      toast("Batch added", "success");
      reset();
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to add batch", "error");
    }
  };

  const handleDelete = async (batchId: string) => {
    if (!confirm("Delete this batch?")) return;
    try {
      await deleteBatch(batchId, productId);
      toast("Batch deleted", "success");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete batch", "error");
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add batch
        </Button>
      </div>

      {sorted.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">No batches yet. FIFO stock deduction uses the soonest-expiring batch first.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-3 py-2.5">Batch No.</th>
                <th className="px-3 py-2.5">Expiry</th>
                <th className="px-3 py-2.5">MRP</th>
                <th className="px-3 py-2.5">Selling price</th>
                <th className="px-3 py-2.5">Stock</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((b) => {
                const days = differenceInCalendarDays(new Date(b.expiry_date), new Date());
                return (
                  <tr key={b.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-3 py-3 font-medium text-slate-700">{b.batch_number}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {format(new Date(b.expiry_date), "d MMM yyyy")}
                        <Badge tone={expiryTone(days)}>{days < 0 ? "Expired" : `${days}d left`}</Badge>
                      </div>
                    </td>
                    <td className="px-3 py-3">{formatCurrency(Number(b.mrp))}</td>
                    <td className="px-3 py-3">{formatCurrency(Number(b.selling_price))}</td>
                    <td className="px-3 py-3">{b.stock_qty}</td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-danger-50 hover:text-danger-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add batch" size="md">
        <form id="batch-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label="Batch number" htmlFor="batch_number" required error={errors.batch_number?.message}>
            <Input id="batch_number" {...register("batch_number")} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Mfg. date" htmlFor="mfg_date">
              <Input id="mfg_date" type="date" {...register("mfg_date")} />
            </Field>
            <Field label="Expiry date" htmlFor="expiry_date" required error={errors.expiry_date?.message}>
              <Input id="expiry_date" type="date" {...register("expiry_date")} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="MRP (₹)" htmlFor="mrp" required error={errors.mrp?.message}>
              <Input id="mrp" type="number" step="0.01" {...register("mrp", { valueAsNumber: true })} />
            </Field>
            <Field label="Selling price (₹)" htmlFor="selling_price" required error={errors.selling_price?.message}>
              <Input id="selling_price" type="number" step="0.01" {...register("selling_price", { valueAsNumber: true })} />
            </Field>
          </div>
          <Field label="Stock quantity" htmlFor="stock_qty" required error={errors.stock_qty?.message}>
            <Input id="stock_qty" type="number" {...register("stock_qty", { valueAsNumber: true })} />
          </Field>
        </form>
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button form="batch-form" type="submit" loading={isSubmitting}>Add batch</Button>
        </div>
      </Modal>
    </div>
  );
}
