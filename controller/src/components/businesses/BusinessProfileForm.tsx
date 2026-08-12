"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import { businessProfileSchema, type BusinessProfileFormValues } from "@/lib/validations/business";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { updateBusinessProfile, updateBusinessOwnerPassword } from "@/app/(dashboard)/businesses/actions";
import type { Business, BusinessOwner } from "@/lib/types/database";

export function BusinessProfileForm({ business, owner }: { business: Business; owner: BusinessOwner }) {
  const router = useRouter();
  const { toast } = useToast();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BusinessProfileFormValues>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      name: business.name,
      ownerName: owner.full_name,
      phone: business.phone ?? "",
      email: business.email ?? "",
      gstin: business.gstin ?? "",
      drug_license_no: business.drug_license_no ?? "",
      address_line1: business.address_line1 ?? "",
      city: business.city ?? "",
      state: business.state ?? "",
      pincode: business.pincode ?? "",
    },
  });

  const onSubmit = async (values: BusinessProfileFormValues) => {
    try {
      await updateBusinessProfile(business.id, owner.id, values);
      toast("Business profile updated", "success");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update profile", "error");
    }
  };

  const closePasswordModal = () => {
    setPasswordModalOpen(false);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    setPasswordSaving(true);
    try {
      await updateBusinessOwnerPassword(business.id, owner.id, newPassword);
      toast("Password updated", "success");
      closePasswordModal();
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Business name" htmlFor="name" required error={errors.name?.message} className="sm:col-span-2">
          <Input id="name" {...register("name")} />
        </Field>
        <Field label="Business type" htmlFor="business_type" required error={errors.business_type?.message} className="sm:col-span-2">
          <Select id="business_type" defaultValue={business.business_type ?? ""} {...register("business_type")}>
            <option value="" disabled>
              Select a business type
            </option>
            <option value="wholesaler">Wholesaler</option>
            <option value="retailer">Retailer</option>
          </Select>
        </Field>
        <Field label="Owner name" htmlFor="ownerName" required error={errors.ownerName?.message}>
          <Input id="ownerName" {...register("ownerName")} />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <Input id="phone" {...register("phone")} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" {...register("email")} />
        </Field>
        <Field label="GSTIN" htmlFor="gstin">
          <Input id="gstin" {...register("gstin")} />
        </Field>
        <Field label="Drug license no." htmlFor="drug_license_no">
          <Input id="drug_license_no" {...register("drug_license_no")} />
        </Field>
        <Field label="Address" htmlFor="address_line1" className="sm:col-span-2">
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
        <Button type="button" variant="outline" onClick={() => setPasswordModalOpen(true)}>
          <KeyRound className="h-4 w-4" /> Change password
        </Button>
        <Button type="submit" loading={isSubmitting}>Save changes</Button>
      </div>

      <Modal open={passwordModalOpen} onClose={closePasswordModal} title={`Change password — ${owner.full_name}`} size="sm">
        <div className="flex flex-col gap-4">
          <Field label="New password" htmlFor="new-password" required error={passwordError || undefined}>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Field>
          <Field label="Confirm password" htmlFor="confirm-password" required>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={closePasswordModal}>Cancel</Button>
          <Button type="button" onClick={handleChangePassword} loading={passwordSaving}>Update password</Button>
        </div>
      </Modal>
    </form>
  );
}
