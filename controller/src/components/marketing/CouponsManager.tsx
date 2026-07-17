"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { couponSchema, type CouponFormValues } from "@/lib/validations/marketing";
import { createCoupon, deleteCoupon, toggleCouponStatus } from "@/app/(dashboard)/marketing/actions";
import { formatCurrency } from "@/lib/format";
import type { Coupon } from "@/lib/types/database";

export function CouponsManager({ coupons }: { coupons: Coupon[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: { discount_type: "percentage", status: "active", min_order_value: 0 },
  });

  const onSubmit = async (values: CouponFormValues) => {
    try {
      await createCoupon(values);
      toast("Coupon created", "success");
      reset();
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to create coupon", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      await deleteCoupon(id);
      toast("Coupon deleted", "success");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete", "error");
    }
  };

  const handleToggle = async (coupon: Coupon) => {
    try {
      await toggleCouponStatus(coupon.id, coupon.status === "active" ? "inactive" : "active");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update", "error");
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Create coupon
        </Button>
      </div>

      {coupons.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">No coupons yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-3 py-2.5">Code</th>
                <th className="px-3 py-2.5">Discount</th>
                <th className="px-3 py-2.5">Min. order</th>
                <th className="px-3 py-2.5">Usage</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-3 py-3 font-mono font-medium text-slate-700">{c.code}</td>
                  <td className="px-3 py-3">
                    {c.discount_type === "percentage" ? `${c.discount_value}%` : formatCurrency(Number(c.discount_value))}
                  </td>
                  <td className="px-3 py-3">{formatCurrency(Number(c.min_order_value))}</td>
                  <td className="px-3 py-3">{c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ""}</td>
                  <td className="px-3 py-3">
                    <button onClick={() => handleToggle(c)}>
                      <Badge tone={c.status === "active" ? "success" : "slate"}>{c.status}</Badge>
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <button onClick={() => handleDelete(c.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-danger-50 hover:text-danger-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create coupon" size="md">
        <form id="coupon-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label="Code" htmlFor="code" required error={errors.code?.message}>
            <Input id="code" placeholder="e.g. WELCOME10" {...register("code")} />
          </Field>
          <Field label="Description" htmlFor="description">
            <Input id="description" {...register("description")} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Discount type" htmlFor="discount_type" required>
              <Select id="discount_type" {...register("discount_type")}>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </Select>
            </Field>
            <Field label="Discount value" htmlFor="discount_value" required error={errors.discount_value?.message}>
              <Input id="discount_value" type="number" step="0.01" {...register("discount_value", { valueAsNumber: true })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Min. order value (₹)" htmlFor="min_order_value" error={errors.min_order_value?.message}>
              <Input id="min_order_value" type="number" step="0.01" {...register("min_order_value", { valueAsNumber: true })} />
            </Field>
            <Field label="Max discount (₹)" htmlFor="max_discount">
              <Input id="max_discount" type="number" step="0.01" {...register("max_discount", { valueAsNumber: true })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Valid from" htmlFor="valid_from">
              <Input id="valid_from" type="date" {...register("valid_from")} />
            </Field>
            <Field label="Valid until" htmlFor="valid_until">
              <Input id="valid_until" type="date" {...register("valid_until")} />
            </Field>
          </div>
          <Field label="Usage limit" htmlFor="usage_limit" hint="Leave blank for unlimited">
            <Input id="usage_limit" type="number" {...register("usage_limit", { valueAsNumber: true })} />
          </Field>
          <Field label="Status" htmlFor="status" required>
            <Select id="status" {...register("status")}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
        </form>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button form="coupon-form" type="submit" loading={isSubmitting}>Create coupon</Button>
        </div>
      </Modal>
    </div>
  );
}
