"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Pencil, ImageOff, Upload, Loader2, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/format";
import { bannerSchema, type BannerFormValues } from "@/lib/validations/marketing";
import { createBanner, updateBanner, deleteBanner, toggleBannerStatus, uploadBannerImage } from "@/app/(dashboard)/marketing/actions";
import type { Banner } from "@/lib/types/database";

const EMPTY_DEFAULTS: BannerFormValues = { title: "", image_url: "", link_url: "", position: "hero", sort_order: 0, status: "active", starts_at: "", ends_at: "" };

// The stored status is just a manual on/off flag -- whether a banner is
// actually showing right now also depends on its schedule, so the badge
// needs to reflect the combination, not just b.status, or a banner can say
// "active" while it's really expired or hasn't started yet.
function getEffectiveStatus(banner: Banner): { label: string; tone: "success" | "slate" | "warning" | "danger" } {
  if (banner.status === "inactive") return { label: "Paused", tone: "slate" };
  const now = new Date();
  // ends_at is a date-only value stored at midnight UTC of that day -- an
  // "Ends Aug 5" banner should run through all of Aug 5, so it's only
  // expired once we're past that whole day, not the instant it turns Aug 5.
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  if (banner.ends_at && new Date(banner.ends_at) < startOfToday) return { label: "Expired", tone: "danger" };
  if (banner.starts_at && new Date(banner.starts_at) > now) return { label: "Scheduled", tone: "warning" };
  return { label: "Active", tone: "success" };
}

export function BannersManager({ banners }: { banners: Banner[] }) {
  const [open, setOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: EMPTY_DEFAULTS,
  });

  const imageUrl = watch("image_url");

  const openCreate = () => {
    setEditingBanner(null);
    reset(EMPTY_DEFAULTS);
    setPreview(null);
    setOpen(true);
  };

  const openEdit = (banner: Banner) => {
    setEditingBanner(banner);
    reset({
      title: banner.title,
      image_url: banner.image_url,
      link_url: banner.link_url ?? "",
      position: banner.position,
      sort_order: banner.sort_order,
      status: banner.status,
      starts_at: banner.starts_at ?? "",
      ends_at: banner.ends_at ?? "",
    });
    setPreview(null);
    setOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const publicUrl = await uploadBannerImage(formData);
      setValue("image_url", publicUrl, { shouldValidate: true });
      setPreview(publicUrl);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to upload image", "error");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: BannerFormValues) => {
    try {
      if (editingBanner) {
        await updateBanner(editingBanner.id, values);
        toast("Banner updated", "success");
      } else {
        await createBanner(values);
        toast("Banner created", "success");
      }
      reset(EMPTY_DEFAULTS);
      setPreview(null);
      setOpen(false);
      setEditingBanner(null);
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save banner", "error");
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
      toast(banner.status === "active" ? "Banner paused" : "Banner resumed", "success");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update", "error");
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Create banner
        </Button>
      </div>

      {banners.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">No banners yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {banners.map((b) => {
            const effective = getEffectiveStatus(b);
            return (
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
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => openEdit(b)} className="rounded-lg p-1 text-slate-400 hover:bg-primary-50 hover:text-primary-600">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggle(b)}
                      aria-label={b.status === "active" ? "Pause" : "Resume"}
                      className={
                        b.status === "active"
                          ? "rounded-lg p-1 text-danger-500 hover:bg-danger-50"
                          : "rounded-lg p-1 text-success-600 hover:bg-success-50"
                      }
                    >
                      {b.status === "active" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => handleDelete(b.id)} className="rounded-lg p-1 text-slate-400 hover:bg-danger-50 hover:text-danger-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="slate">{b.position}</Badge>
                  <Badge tone={effective.tone}>{effective.label}</Badge>
                </div>
                {b.ends_at && <p className="mt-2 text-xs text-slate-400">Ends {formatDate(b.ends_at)}</p>}
              </div>
            </div>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingBanner(null);
        }}
        title={editingBanner ? "Edit banner" : "Create banner"}
        size="md"
      >
        <form id="banner-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label="Title" htmlFor="title" required error={errors.title?.message}>
            <Input id="title" {...register("title")} />
          </Field>
          <Field label="Banner image" htmlFor="image_upload" required error={errors.image_url?.message} hint="PNG or JPG, ideally 3:1 aspect ratio">
            <input type="hidden" {...register("image_url")} />
            {(preview || imageUrl) && (
              <div className="mb-2 flex h-28 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview || imageUrl} alt="Banner preview" className="h-full w-full object-cover" />
              </div>
            )}
            <label
              htmlFor="image_upload"
              className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 text-sm font-medium text-slate-600 hover:border-primary-400 hover:text-primary-600"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" /> {imageUrl ? "Replace image" : "Upload image"}
                </>
              )}
            </label>
            <input
              id="image_upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </Field>
          <Field label="Link URL" htmlFor="link_url">
            <Input id="link_url" placeholder="https://..." {...register("link_url")} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Position" htmlFor="position" required>
              <Select id="position" {...register("position")}>
                <option value="hero">Hero</option>
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
          <Button variant="outline" onClick={() => { setOpen(false); setEditingBanner(null); }}>Cancel</Button>
          <Button form="banner-form" type="submit" loading={isSubmitting} disabled={uploading || !imageUrl}>
            {editingBanner ? "Save changes" : "Create banner"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
