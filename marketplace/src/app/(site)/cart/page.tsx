import { requireCurrentBusiness } from "@/lib/supabase/require-business";
import { CartTable } from "@/components/cart/CartTable";

export default async function CartPage() {
  await requireCurrentBusiness("/cart");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Your cart</h1>
      <CartTable />
    </div>
  );
}
