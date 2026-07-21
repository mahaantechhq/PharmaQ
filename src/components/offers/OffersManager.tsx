"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Percent } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { offerSchema, type OfferFormValues } from "@/lib/validations/offer";
import { createOffer, deleteOffer, toggleOfferStatus } from "@/app/(dashboard)/offers/actions";
import { formatDate } from "@/lib/format";
import type { Offer } from "@/lib/types/database";

function formatDiscount(offer: Offer) {
  return offer.discount_type === "percentage" ? `${Number(offer.discount_value)}% off` : `₹${Number(offer.discount_value)} off`;
}

export function OffersManager({ offers }: { offers: Offer[] }) {
  const [open, setOpen] = useState(false);
  const [startsImmediately, setStartsImmediately] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: { discount_type: "flat", min_order_amount: 0, status: "active" },
  });

  const discountType = watch("discount_type");

  const onSubmit = async (values: OfferFormValues) => {
    try {
      await createOffer({ ...values, starts_at: startsImmediately ? undefined : values.starts_at });
      toast("Offer created", "success");
      reset();
      setStartsImmediately(true);
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to create offer", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this offer?")) return;
    try {
      await deleteOffer(id);
      toast("Offer deleted", "success");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete", "error");
    }
  };

  const handleToggle = async (offer: Offer) => {
    try {
      await toggleOfferStatus(offer.id, offer.status === "active" ? "inactive" : "active");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update", "error");
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Create offer
        </Button>
      </div>

      {offers.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">No offers yet — create one to show buyers a discount on your products.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((o) => (
            <div key={o.id} className="rounded-xl border border-slate-100 p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <Percent className="h-4 w-4" />
                </div>
                <button onClick={() => handleDelete(o.id)} className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-danger-50 hover:text-danger-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="truncate text-sm font-semibold text-slate-800">{o.name}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{o.display_text}</p>
              <p className="mt-2 text-sm font-medium text-primary-600">{formatDiscount(o)}</p>
              <p className="mt-1 text-xs text-slate-400">
                Min order ₹{Number(o.min_order_amount)} · Expires {formatDate(o.expires_at)}
              </p>
              <div className="mt-3">
                <button onClick={() => handleToggle(o)}>
                  <Badge tone={o.status === "active" ? "success" : "slate"}>{o.status}</Badge>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create offer" size="md">
        <form id="offer-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div>
            <p className="mb-3 text-sm font-semibold text-slate-800">Description</p>
            <div className="flex flex-col gap-4">
              <Field label="Offer Name" htmlFor="name" required error={errors.name?.message} hint="This name appears on your dashboard">
                <Input id="name" placeholder="Example: New Year Sale" {...register("name")} />
              </Field>
              <Field label="Display Text" htmlFor="display_text" required error={errors.display_text?.message} hint="This appears at checkout for your customers">
                <Textarea id="display_text" placeholder="10% off on all orders above ₹500" rows={2} {...register("display_text")} />
              </Field>
            </div>
          </div>

          <div>
            <p className="mb-1 text-sm font-semibold text-slate-800">Discount type</p>
            <p className="mb-3 text-xs text-slate-500">Instant discount — the buyer pays the discounted price for the order.</p>
            <div className="flex flex-col gap-4">
              <Field label="Discount Type" htmlFor="discount_type" required>
                <Select id="discount_type" {...register("discount_type")}>
                  <option value="flat">Flat</option>
                  <option value="percentage">Percentage</option>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Minimum Order amount" htmlFor="min_order_amount" required error={errors.min_order_amount?.message}>
                  <Input id="min_order_amount" type="number" step="0.01" placeholder="0.00" {...register("min_order_amount", { valueAsNumber: true })} />
                </Field>
                <Field label="Maximum Order amount" htmlFor="max_order_amount">
                  <Input id="max_order_amount" type="number" step="0.01" placeholder="0.00" {...register("max_order_amount", { valueAsNumber: true })} />
                </Field>
              </div>
              <Field
                label="Discount Worth"
                htmlFor="discount_value"
                required
                error={errors.discount_value?.message}
                hint={discountType === "percentage" ? "Discount worth in Percent" : "Discount worth in cash"}
              >
                <Input id="discount_value" type="number" step="0.01" placeholder="0.00" {...register("discount_value", { valueAsNumber: true })} />
              </Field>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-slate-800">Offer Validity</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Starting On" htmlFor="starts_at" hint="Start date for offer">
                <label className="mb-1.5 flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={startsImmediately}
                    onChange={(e) => setStartsImmediately(e.target.checked)}
                  />
                  Starts Immediately
                </label>
                <Input id="starts_at" type="date" disabled={startsImmediately} {...register("starts_at")} />
              </Field>
              <Field label="Expires On" htmlFor="expires_at" required error={errors.expires_at?.message} hint="Expiry date for offer">
                <Input id="expires_at" type="date" {...register("expires_at")} />
              </Field>
            </div>
          </div>

          <Field label="Status" htmlFor="status" required>
            <Select id="status" {...register("status")}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
        </form>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button form="offer-form" type="submit" loading={isSubmitting}>Create offer</Button>
        </div>
      </Modal>
    </div>
  );
}
