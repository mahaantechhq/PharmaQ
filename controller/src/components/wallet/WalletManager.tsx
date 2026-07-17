"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, CreditCard, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { adjustWallet, updateCreditLimit } from "@/app/(dashboard)/wallet/actions";
import { formatCurrency } from "@/lib/format";

interface WalletRow {
  businessId: string;
  businessName: string;
  balance: number;
  creditLimit: number;
}

export function WalletManager({ wallets }: { wallets: WalletRow[] }) {
  const [search, setSearch] = useState("");
  const [adjustTarget, setAdjustTarget] = useState<WalletRow | null>(null);
  const [creditLimitTarget, setCreditLimitTarget] = useState<WalletRow | null>(null);
  const [type, setType] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [newLimit, setNewLimit] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const filtered = wallets.filter((w) => w.businessName.toLowerCase().includes(search.toLowerCase()));

  const handleAdjust = async () => {
    if (!adjustTarget || !amount) return;
    setLoading(true);
    try {
      await adjustWallet(adjustTarget.businessId, type, Number(amount), reason);
      toast("Wallet updated", "success");
      setAdjustTarget(null);
      setAmount("");
      setReason("");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to adjust wallet", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreditLimit = async () => {
    if (!creditLimitTarget || newLimit === "") return;
    setLoading(true);
    try {
      await updateCreditLimit(creditLimitTarget.businessId, Number(newLimit));
      toast("Credit limit updated", "success");
      setCreditLimitTarget(null);
      setNewLimit("");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update credit limit", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="relative mb-4 w-full max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input placeholder="Search businesses..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="px-3 py-2.5">Business</th>
              <th className="px-3 py-2.5">Balance</th>
              <th className="px-3 py-2.5">Credit limit</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((w) => (
              <tr key={w.businessId} className="border-b border-slate-50 last:border-0">
                <td className="px-3 py-3 font-medium text-slate-700">{w.businessName}</td>
                <td className="px-3 py-3">{formatCurrency(w.balance)}</td>
                <td className="px-3 py-3">{formatCurrency(w.creditLimit)}</td>
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setCreditLimitTarget(w); setNewLimit(String(w.creditLimit)); }}>
                      <CreditCard className="h-3.5 w-3.5" /> Credit limit
                    </Button>
                    <Button size="sm" onClick={() => { setAdjustTarget(w); setType("credit"); }}>
                      Adjust
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!adjustTarget} onClose={() => setAdjustTarget(null)} title={`Adjust wallet — ${adjustTarget?.businessName ?? ""}`} size="sm">
        <div className="flex flex-col gap-4">
          <Field label="Type" htmlFor="adjust-type">
            <Select id="adjust-type" value={type} onChange={(e) => setType(e.target.value as "credit" | "debit")}>
              <option value="credit">Credit (add funds)</option>
              <option value="debit">Debit (remove funds)</option>
            </Select>
          </Field>
          <Field label="Amount (₹)" htmlFor="adjust-amount">
            <Input id="adjust-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Reason" htmlFor="adjust-reason" hint="Shown to the business as a notification">
            <Input id="adjust-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Settlement for order #..." />
          </Field>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setAdjustTarget(null)}>Cancel</Button>
          <Button onClick={handleAdjust} loading={loading}>
            {type === "credit" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
            Confirm {type}
          </Button>
        </div>
      </Modal>

      <Modal open={!!creditLimitTarget} onClose={() => setCreditLimitTarget(null)} title={`Credit limit — ${creditLimitTarget?.businessName ?? ""}`} size="sm">
        <Field label="Credit limit (₹)" htmlFor="credit-limit">
          <Input id="credit-limit" type="number" value={newLimit} onChange={(e) => setNewLimit(e.target.value)} />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setCreditLimitTarget(null)}>Cancel</Button>
          <Button onClick={handleCreditLimit} loading={loading}>Save</Button>
        </div>
      </Modal>
    </div>
  );
}
