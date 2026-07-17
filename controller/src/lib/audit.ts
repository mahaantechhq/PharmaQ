import { createClient } from "@/lib/supabase/server";

export async function logAudit(params: {
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("audit_logs").insert({
    actor_id: params.actorId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    metadata: params.metadata ?? null,
  });

  // Never throw here — a broken audit trail shouldn't block the actual
  // admin operation that already succeeded. But it must not be silent:
  // this is the only record of who did what for compliance-sensitive
  // actions (wallet adjustments, business approval/suspension).
  if (error) {
    console.error(`[audit] failed to log "${params.action}" on ${params.entityType}:`, error.message);
  }
}
