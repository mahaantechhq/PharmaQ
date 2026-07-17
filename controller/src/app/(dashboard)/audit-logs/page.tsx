import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { AuditLogExplorer } from "@/components/audit/AuditLogExplorer";
import type { AuditLog } from "@/lib/types/database";

export default async function AuditLogsPage() {
  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <PageHeader title="Audit logs" description="Every administrative action taken on the platform." />
      <Card className="p-5">
        <AuditLogExplorer logs={(logs ?? []) as AuditLog[]} />
      </Card>
    </div>
  );
}
