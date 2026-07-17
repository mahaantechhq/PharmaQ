"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { updatePlatformSettings, type PlatformSettingsValues } from "@/app/(dashboard)/settings/actions";

export function PlatformSettingsForm({ defaultValues }: { defaultValues: PlatformSettingsValues }) {
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<PlatformSettingsValues>({ defaultValues });

  const onSubmit = async (values: PlatformSettingsValues) => {
    try {
      await updatePlatformSettings({
        ...values,
        default_commission_percent: Number(values.default_commission_percent),
        maintenance_mode: Boolean(values.maintenance_mode),
      });
      toast("Settings saved", "success");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save settings", "error");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Site name" htmlFor="site_name">
          <Input id="site_name" {...register("site_name")} />
        </Field>
        <Field label="Default commission (%)" htmlFor="default_commission_percent">
          <Input id="default_commission_percent" type="number" step="0.01" {...register("default_commission_percent", { valueAsNumber: true })} />
        </Field>
        <Field label="Support email" htmlFor="support_email">
          <Input id="support_email" type="email" {...register("support_email")} />
        </Field>
        <Field label="Support phone" htmlFor="support_phone">
          <Input id="support_phone" {...register("support_phone")} />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-300" {...register("maintenance_mode")} />
        Maintenance mode — temporarily disables new orders across the marketplace
      </label>

      <div className="flex justify-end border-t border-slate-100 pt-5">
        <Button type="submit" loading={isSubmitting}>Save settings</Button>
      </div>
    </form>
  );
}
