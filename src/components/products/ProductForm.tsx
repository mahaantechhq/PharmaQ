"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, type ProductFormValues } from "@/lib/validations/product";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createProduct, updateProduct } from "@/app/(dashboard)/products/actions";
import type { Category, Brand, Manufacturer } from "@/lib/types/database";

interface ProductFormProps {
  productId?: string;
  batchId?: string;
  defaultValues?: Partial<ProductFormValues>;
  categories: Category[];
  brands: Brand[];
  manufacturers: Manufacturer[];
}

export function ProductForm({ productId, batchId, defaultValues, categories, brands, manufacturers }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      status: "draft",
      gst_rate: 12,
      stock_qty: 0,
      ...defaultValues,
    },
  });

  const onSubmit = async (values: ProductFormValues) => {
    try {
      if (productId) {
        await updateProduct(productId, values, batchId);
        toast("Product updated", "success");
      } else {
        const id = await createProduct(values);
        toast("Product created", "success");
        router.push(`/products/${id}`);
        return;
      }
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Something went wrong", "error");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Product name" htmlFor="name" required error={errors.name?.message} className="sm:col-span-2">
          <Input id="name" placeholder="e.g. Paracetamol 650mg" {...register("name")} />
        </Field>

        <Field label="Composition" htmlFor="composition" error={errors.composition?.message}>
          <Input id="composition" placeholder="e.g. Paracetamol 650mg" {...register("composition")} />
        </Field>

        <Field label="Pack size" htmlFor="pack_size" error={errors.pack_size?.message}>
          <Input id="pack_size" placeholder="e.g. Strip of 15" {...register("pack_size")} />
        </Field>

        <Field label="Category" htmlFor="category_id">
          <Select id="category_id" {...register("category_id")}>
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>

        <Field label="Brand" htmlFor="brand_id">
          <Select id="brand_id" {...register("brand_id")}>
            <option value="">Select brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
        </Field>

        <Field label="Manufacturer" htmlFor="manufacturer_id">
          <Select id="manufacturer_id" {...register("manufacturer_id")}>
            <option value="">Select manufacturer</option>
            {manufacturers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
        </Field>

        <Field label="HSN code" htmlFor="hsn_code" error={errors.hsn_code?.message}>
          <Input id="hsn_code" placeholder="e.g. 3004" {...register("hsn_code")} />
        </Field>

        <Field label="GST rate (%)" htmlFor="gst_rate" required error={errors.gst_rate?.message}>
          <Input id="gst_rate" type="number" step="0.01" {...register("gst_rate", { valueAsNumber: true })} />
        </Field>

        <Field label="Status" htmlFor="status" required>
          <Select id="status" {...register("status")}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </Field>

        <Field label="Description" htmlFor="description" className="sm:col-span-2">
          <Textarea id="description" rows={3} placeholder="Additional details about this product" {...register("description")} />
        </Field>
      </div>

      <div className="border-t border-slate-100 pt-5">
        <p className="mb-3 text-sm font-semibold text-slate-800">Stock &amp; pricing</p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Batch number" htmlFor="batch_number" required error={errors.batch_number?.message}>
            <Input id="batch_number" {...register("batch_number")} />
          </Field>
          <Field label="Mfg. date" htmlFor="mfg_date">
            <Input id="mfg_date" type="date" {...register("mfg_date")} />
          </Field>
          <Field label="Expiry date" htmlFor="expiry_date" required error={errors.expiry_date?.message}>
            <Input id="expiry_date" type="date" {...register("expiry_date")} />
          </Field>
          <Field label="Stock quantity" htmlFor="stock_qty" required error={errors.stock_qty?.message}>
            <Input id="stock_qty" type="number" {...register("stock_qty", { valueAsNumber: true })} />
          </Field>
          <Field label="MRP (₹)" htmlFor="mrp" required error={errors.mrp?.message}>
            <Input id="mrp" type="number" step="0.01" {...register("mrp", { valueAsNumber: true })} />
          </Field>
          <Field label="Selling price (₹)" htmlFor="selling_price" required error={errors.selling_price?.message}>
            <Input id="selling_price" type="number" step="0.01" {...register("selling_price", { valueAsNumber: true })} />
          </Field>
          <Field label="Scheme" htmlFor="scheme" error={errors.scheme?.message} hint="e.g. 5+1">
            <Input id="scheme" placeholder="e.g. 5+1" {...register("scheme")} />
          </Field>
          <Field label="Discount %" htmlFor="discount_percent" error={errors.discount_percent?.message}>
            <Input id="discount_percent" type="number" step="0.01" {...register("discount_percent", { valueAsNumber: true })} />
          </Field>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
        <Button type="button" variant="outline" onClick={() => router.push("/products")}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {productId ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
