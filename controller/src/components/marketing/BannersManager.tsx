"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { bannerSchema, type BannerFormValues } from "@/lib/validations/marketing";
import { createBanner, deleteBanner, toggleBannerStatus } from "@/app/(dashboard)/marketing/actions";
import type { Banner } from "@/lib/types/database";

export function BannersManager({ banners }: { banners: Banner[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: { position: "hero", status: "active", sort_order: 0 },
  });

  const onSubmit = async (values: BannerFormValues) => {
    try {
      await createBanner(values);
      toast("Banner created", "success");
      reset();
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to create banner", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    try {
      await deleteBanner(id);
      toast("Banner deleted", "success");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete", "error");
    }
  };

  const handleToggle = async (banner: Banner) => {
    try {
      await toggleBannerStatus(banner.id, banner.status === "active" ? "inactive" : "active");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update", "error");
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Create banner
        </Button>
      </div>

      {banners.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">No banners yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {banners.map((b) => (
            <div key={b.id} className="overflow-hidden rounded-xl border border-slate-100">
              <div className="flex h-32 items-center justify-center bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.image_url}
                  alt={b.title}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <ImageOff className="hidden h-6 w-6 text-slate-300" />
              </div>
              <div className="p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-slate-800">{b.title}</p>
                  <button onClick={() => handleDelete(b.id)} className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-danger-50 hover:text-danger-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="slate">{b.position}</Badge>
                  <button onClick={() => handleToggle(b)}>
                    <Badge tone={b.status === "active" ? "success" : "slate"}>{b.status}</Badge>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create banner" size="md">
        <form id="banner-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label="Title" htmlFor="title" required error={errors.title?.message}>
            <Input id="title" {...register("title")} />
          </Field>
          <Field label="Image URL" htmlFor="image_url" required error={errors.image_url?.message} hint="Paste a hosted image URL">
            <Input id="image_url" placeholder="https://..." {...register("image_url")} />
          </Field>
          <Field label="Link URL" htmlFor="link_url">
            <Input id="link_url" placeholder="https://..." {...register("link_url")} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Position" htmlFor="position" required>
              <Select id="position" {...register("position")}>
                <option value="hero">Hero</option>
                <option value="category">Category</option>
                <option value="sidebar">Sidebar</option>
              </Select>
            </Field>
            <Field label="Sort order" htmlFor="sort_order">
              <Input id="sort_order" type="number" {...register("sort_order", { valueAsNumber: true })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Starts at" htmlFor="starts_at">
              <Input id="starts_at" type="date" {...register("starts_at")} />
            </Field>
            <Field label="Ends at" htmlFor="ends_at">
              <Input id="ends_at" type="date" {...register("ends_at")} />
            </Field>
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
          <Button form="banner-form" type="submit" loading={isSubmitting}>Create banner</Button>
        </div>
      </Modal>
    </div>
  );
}
