"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { placeOrder } from "@/app/(site)/checkout/actions";

export function CheckoutConfirm({ couponCode }: { couponCode?: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const result = await placeOrder(couponCode);
      toast(`Order ${result.orderNumber} placed successfully`, "success");
      router.push(`/orders/${result.orderId}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to place order", "error");
      setLoading(false);
    }
  };

  return (
    <Button size="lg" className="w-full" onClick={handleConfirm} loading={loading}>
      <CheckCircle2 className="h-4 w-4" /> Place order
    </Button>
  );
}
