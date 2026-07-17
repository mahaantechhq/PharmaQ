import { requireCurrentBusiness } from "@/lib/supabase/require-business";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/Card";
import { NotificationList } from "@/components/notifications/NotificationList";
import type { Notification } from "@/lib/types/database";

export default async function NotificationsPage() {
  const ctx = await requireCurrentBusiness("/notifications");
  const supabase = await createClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("business_id", ctx.business.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Notifications</h1>
      <Card>
        <CardBody>
          <NotificationList notifications={(notifications ?? []) as Notification[]} />
        </CardBody>
      </Card>
    </div>
  );
}
