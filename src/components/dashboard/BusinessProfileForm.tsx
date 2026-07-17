"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { businessProfileSchema, type BusinessProfileFormValues } from "@/lib/validations/business";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { updateBusinessProfile } from "@/app/(dashboard)/settings/actions";
import type { Business } from "@/lib/types/database";

export function BusinessProfileForm({ business }: { business: Business }) {
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BusinessProfileFormValues>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      name: business.name,
      phone: business.phone ?? "",
      email: business.email ?? "",
      gstin: business.gstin ?? "",
      drug_license_no: business.drug_license_no ?? "",
      address_line1: business.address_line1 ?? "",
      address_line2: business.address_line2 ?? "",
      city: business.city ?? "",
      state: business.state ?? "",
      pincode: business.pincode ?? "",
    },
  });

  const onSubmit = async (values: BusinessProfileFormValues) => {
    try {
      await updateBusinessProfile(values);
      toast("Business profile updated", "success");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update profile", "error");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Business name" htmlFor="name" required error={errors.name?.message} className="sm:col-span-2">
          <Input id="name" {...register("name")} />
        </Field>
        <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
          <Input id="phone" {...register("phone")} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" {...register("email")} />
        </Field>
        <Field label="GSTIN" htmlFor="gstin" error={errors.gstin?.message}>
          <Input id="gstin" {...register("gstin")} />
        </Field>
        <Field label="Drug license no." htmlFor="drug_license_no" error={errors.drug_license_no?.message}>
          <Input id="drug_license_no" {...register("drug_license_no")} />
        </Field>
        <Field label="Address line 1" htmlFor="address_line1" className="sm:col-span-2">
          <Input id="address_line1" {...register("address_line1")} />
        </Field>
        <Field label="Address line 2" htmlFor="address_line2" className="sm:col-span-2">
          <Input id="address_line2" {...register("address_line2")} />
        </Field>
        <Field label="City" htmlFor="city">
          <Input id="city" {...register("city")} />
        </Field>
        <Field label="State" htmlFor="state">
          <Input id="state" {...register("state")} />
        </Field>
        <Field label="Pincode" htmlFor="pincode">
          <Input id="pincode" {...register("pincode")} />
        </Field>
      </div>

      <div className="flex justify-end border-t border-slate-100 pt-5">
        <Button type="submit" loading={isSubmitting}>Save changes</Button>
      </div>
    </form>
  );
}
