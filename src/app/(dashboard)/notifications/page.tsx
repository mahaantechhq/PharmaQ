import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { NotificationList } from "@/components/dashboard/NotificationList";
import type { Notification } from "@/lib/types/database";

export default async function NotificationsPage() {
  const ctx = await getCurrentBusiness();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("business_id", ctx.business.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Notifications" description="Stay on top of orders, inventory, and wallet activity." />
      <Card>
        <CardBody>
          <NotificationList notifications={(notifications ?? []) as Notification[]} />
        </CardBody>
      </Card>
    </div>
  );
}
