"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, CheckCircle2 } from "lucide-react";
import { createBusinessSchema, type CreateBusinessFormValues } from "@/lib/validations/business";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { createBusiness } from "@/app/(dashboard)/businesses/actions";

export function CreateBusinessForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState<{ email: string; password: string; businessId: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateBusinessFormValues>({ resolver: zodResolver(createBusinessSchema) });

  const onSubmit = async (values: CreateBusinessFormValues) => {
    try {
      const result = await createBusiness(values);
      setCredentials(result);
      toast("Business created", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to create business", "error");
    }
  };

  const copyCredentials = () => {
    if (!credentials) return;
    navigator.clipboard.writeText(`Email: ${credentials.email}\nPassword: ${credentials.password}`);
    toast("Copied to clipboard", "success");
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Business name" htmlFor="name" required error={errors.name?.message} className="sm:col-span-2">
            <Input id="name" placeholder="e.g. ABC Medicals" {...register("name")} />
          </Field>

          <Field label="Owner full name" htmlFor="ownerName" required error={errors.ownerName?.message}>
            <Input id="ownerName" placeholder="e.g. Anil Bhatia" {...register("ownerName")} />
          </Field>

          <Field label="Login email" htmlFor="email" required error={errors.email?.message} hint="This becomes the login for both apps">
            <Input id="email" type="email" placeholder="owner@business.com" {...register("email")} />
          </Field>

          <Field label="Password" htmlFor="password" required error={errors.password?.message} hint="At least 8 characters">
            <Input id="password" type="password" placeholder="Set a login password" {...register("password")} />
          </Field>

          <Field label="Confirm password" htmlFor="confirmPassword" required error={errors.confirmPassword?.message}>
            <Input id="confirmPassword" type="password" placeholder="Re-enter the password" {...register("confirmPassword")} />
          </Field>

          <Field label="Phone" htmlFor="phone">
            <Input id="phone" {...register("phone")} />
          </Field>

          <Field label="GSTIN" htmlFor="gstin">
            <Input id="gstin" {...register("gstin")} />
          </Field>

          <Field label="Drug license no." htmlFor="drug_license_no">
            <Input id="drug_license_no" {...register("drug_license_no")} />
          </Field>

          <Field label="Address" htmlFor="address_line1">
            <Input id="address_line1" {...register("address_line1")} />
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

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
          <Button type="button" variant="outline" onClick={() => router.push("/businesses")}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Create business
          </Button>
        </div>
      </form>

      <Modal
        open={!!credentials}
        onClose={() => {
          setCredentials(null);
          router.push(`/businesses/${credentials?.businessId}`);
        }}
        title="Business created"
        description="Share these login credentials with the business owner — this is shown only once."
        size="sm"
      >
        {credentials && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-success-50 px-3 py-2 text-sm text-success-600">
              <CheckCircle2 className="h-4 w-4" /> Ready to hand off
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="text-slate-500">Email</p>
              <p className="mb-2 font-medium text-slate-800">{credentials.email}</p>
              <p className="text-slate-500">Password</p>
              <p className="font-mono font-medium text-slate-800">{credentials.password}</p>
            </div>
            <Button variant="outline" onClick={copyCredentials}>
              <Copy className="h-4 w-4" /> Copy credentials
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}
