import { ArrowDownLeft, ArrowUpRight, CreditCard, Wallet as WalletIcon } from "lucide-react";
import { requireCurrentBusiness } from "@/lib/supabase/require-business";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { WalletTransaction } from "@/lib/types/database";

export default async function WalletPage() {
  const ctx = await requireCurrentBusiness("/wallet");
  const supabase = await createClient();

  const { data: wallet } = await supabase.from("wallets").select("*").eq("business_id", ctx.business.id).maybeSingle();

  const { data: transactions } = wallet
    ? await supabase.from("wallet_transactions").select("*").eq("wallet_id", wallet.id).order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Wallet</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success-50 text-success-600">
            <WalletIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Wallet balance</p>
            <p className="text-xl font-semibold text-slate-900">{formatCurrency(Number(wallet?.balance ?? 0))}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Credit limit</p>
            <p className="text-xl font-semibold text-slate-900">{formatCurrency(Number(wallet?.credit_limit ?? 0))}</p>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Transaction history" />
        <CardBody>
          {(transactions ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No transactions yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-slate-50">
              {(transactions as WalletTransaction[]).map((t) => (
                <div key={t.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${t.type === "credit" ? "bg-success-50 text-success-600" : "bg-danger-50 text-danger-600"}`}>
                      {t.type === "credit" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{t.description ?? (t.type === "credit" ? "Credit" : "Debit")}</p>
                      <p className="text-xs text-slate-400">
                        {formatDateTime(t.created_at)}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${t.type === "credit" ? "text-success-600" : "text-danger-500"}`}>
                    {t.type === "credit" ? "+" : "-"}{formatCurrency(Number(t.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
