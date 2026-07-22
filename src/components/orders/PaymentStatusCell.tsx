"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { updatePaymentStatus } from "@/app/(dashboard)/orders/actions";
import type { PaymentStatus } from "@/lib/types/database";

export function PaymentStatusCell({
  orderId,
  grandTotal,
  initialStatus,
  initialAmountPaid,
}: {
  orderId: string;
  grandTotal: number;
  initialStatus: PaymentStatus;
  initialAmountPaid: number;
}) {
  const [status, setStatus] = useState<PaymentStatus>(initialStatus);
  const [editingPartial, setEditingPartial] = useState(false);
  const [partialAmount, setPartialAmount] = useState(initialAmountPaid > 0 ? String(initialAmountPaid) : "");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const applyStatus = async (next: PaymentStatus, amount?: number) => {
    setLoading(true);
    try {
      await updatePaymentStatus(orderId, next, amount);
      setStatus(next);
      toast("Payment status updated", "success");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update payment status", "error");
    } finally {
      setLoading(false);
      setEditingPartial(false);
    }
  };

  const handleChange = (value: PaymentStatus) => {
    if (value === "partial") {
      setEditingPartial(true);
      return;
    }
    applyStatus(value);
  };

  const handleConfirmPartial = () => {
    const amount = parseFloat(partialAmount);
    if (!amount || amount <= 0 || amount >= grandTotal) {
      toast(`Enter an amount between 0 and ${grandTotal}`, "error");
      return;
    }
    applyStatus("partial", amount);
  };

  if (editingPartial) {
    return (
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          step="0.01"
          autoFocus
          placeholder="Amount paid"
          value={partialAmount}
          onChange={(e) => setPartialAmount(e.target.value)}
          className="h-9 w-28"
        />
        <button
          onClick={handleConfirmPartial}
          disabled={loading}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-success-600 hover:bg-success-50"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          onClick={() => setEditingPartial(false)}
          disabled={loading}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <Select
        value={status}
        onChange={(e) => handleChange(e.target.value as PaymentStatus)}
        disabled={loading}
        className="h-9 w-32"
      >
        <option value="unpaid">Unpaid</option>
        <option value="partial">Partial</option>
        <option value="paid">Paid</option>
      </Select>
      {status === "partial" && (
        <button onClick={() => setEditingPartial(true)} className="text-left text-xs text-primary-600 hover:underline">
          ₹{initialAmountPaid} paid, edit
        </button>
      )}
    </div>
  );
}
