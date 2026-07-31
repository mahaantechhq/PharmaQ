"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CheckCircle2, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { markSubscriptionPaid, markSubscriptionUnpaid, updateSubscriptionFee } from "@/app/(dashboard)/payments/actions";
import { formatCurrency, formatDateTime } from "@/lib/format";

interface PaymentRow {
  businessId: string;
  businessName: string;
  amount: number;
  status: "paid" | "unpaid";
  paidAt: string | null;
}

export function PaymentsManager({ rows, monthlyFee }: { rows: PaymentRow[]; monthlyFee: number }) {
  const [search, setSearch] = useState("");
  const [markPaidTarget, setMarkPaidTarget] = useState<PaymentRow | null>(null);
  const [unmarkTarget, setUnmarkTarget] = useState<PaymentRow | null>(null);
  const [feeModalOpen, setFeeModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [feeInput, setFeeInput] = useState(String(monthlyFee));
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const filtered = rows.filter((r) => r.businessName.toLowerCase().includes(search.toLowerCase()));

  const handleMarkPaid = async () => {
    if (!markPaidTarget || !amount) return;
    setLoading(true);
    try {
      await markSubscriptionPaid(markPaidTarget.businessId, Number(amount));
      toast("Marked as paid", "success");
      setMarkPaidTarget(null);
      setAmount("");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update payment", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkUnpaid = async () => {
    if (!unmarkTarget) return;
    setLoading(true);
    try {
      await markSubscriptionUnpaid(unmarkTarget.businessId, unmarkTarget.amount);
      toast("Marked as unpaid", "success");
      setUnmarkTarget(null);
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update payment", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFee = async () => {
    if (feeInput === "") return;
    setLoading(true);
    try {
      await updateSubscriptionFee(Number(feeInput));
      toast("Monthly fee updated", "success");
      setFeeModalOpen(false);
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update fee", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search businesses..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button size="sm" variant="outline" onClick={() => { setFeeInput(String(monthlyFee)); setFeeModalOpen(true); }}>
          <Settings2 className="h-3.5 w-3.5" /> Monthly fee: {formatCurrency(monthlyFee)}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="px-3 py-2.5">Business</th>
              <th className="px-3 py-2.5">Amount</th>
              <th className="px-3 py-2.5">This month</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.businessId} className="border-b border-slate-50 last:border-0">
                <td className="px-3 py-3 font-medium text-slate-700">{r.businessName}</td>
                <td className="px-3 py-3">{formatCurrency(r.amount)}</td>
                <td className="px-3 py-3">
                  <Badge tone={r.status === "paid" ? "success" : "warning"}>
                    {r.status === "paid" ? "Paid" : "Unpaid"}
                  </Badge>
                  {r.status === "paid" && r.paidAt && (
                    <p className="mt-1 text-xs text-slate-400">{formatDateTime(r.paidAt)}</p>
                  )}
                </td>
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-2">
                    {r.status === "paid" ? (
                      <Button size="sm" variant="outline" onClick={() => setUnmarkTarget(r)}>
                        Mark unpaid
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => { setMarkPaidTarget(r); setAmount(String(r.amount)); }}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Mark paid
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!markPaidTarget} onClose={() => setMarkPaidTarget(null)} title={`Mark paid — ${markPaidTarget?.businessName ?? ""}`} size="sm">
        <Field label="Amount (₹)" htmlFor="paid-amount">
          <Input id="paid-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setMarkPaidTarget(null)}>Cancel</Button>
          <Button onClick={handleMarkPaid} loading={loading}>Confirm paid</Button>
        </div>
      </Modal>

      <Modal open={!!unmarkTarget} onClose={() => setUnmarkTarget(null)} title={`Mark unpaid — ${unmarkTarget?.businessName ?? ""}`} size="sm">
        <p className="text-sm text-slate-500">This clears the paid status for this month. Use this to correct a mistake.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setUnmarkTarget(null)}>Cancel</Button>
          <Button onClick={handleMarkUnpaid} loading={loading}>Confirm</Button>
        </div>
      </Modal>

      <Modal open={feeModalOpen} onClose={() => setFeeModalOpen(false)} title="Monthly subscription fee" size="sm">
        <Field label="Fee (₹)" htmlFor="fee-amount" hint="Applies to every business that hasn't been marked yet this month">
          <Input id="fee-amount" type="number" value={feeInput} onChange={(e) => setFeeInput(e.target.value)} />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setFeeModalOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateFee} loading={loading}>Save</Button>
        </div>
      </Modal>
    </div>
  );
}
