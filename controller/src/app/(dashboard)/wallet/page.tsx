import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { WalletManager } from "@/components/wallet/WalletManager";

export default async function WalletPage() {
  const supabase = await createClient();

  const [{ data: wallets }, { data: businesses }] = await Promise.all([
    supabase.from("wallets").select("*"),
    supabase.from("businesses").select("id, name"),
  ]);

  const businessNames = new Map((businesses ?? []).map((b) => [b.id, b.name]));

  const rows = (wallets ?? []).map((w) => ({
    businessId: w.business_id,
    businessName: businessNames.get(w.business_id) ?? "Unknown business",
    balance: Number(w.balance),
    creditLimit: Number(w.credit_limit),
  }));

  return (
    <div>
      <PageHeader title="Wallet & Credit" description="Manage business wallet balances and credit limits." />
      <Card className="p-5">
        <WalletManager wallets={rows} />
      </Card>
    </div>
  );
}
