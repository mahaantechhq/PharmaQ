import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { BroadcastComposer } from "@/components/notifications/BroadcastComposer";

export default async function NotificationsPage() {
  const supabase = await createClient();

  const [{ data: businesses }, { data: sent }] = await Promise.all([
    supabase.from("businesses").select("id, name").order("name"),
    supabase
      .from("notifications")
      .select("id, title, message, created_at, business_id, businesses:business_id(name)")
      .eq("type", "system")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  return (
    <div>
      <PageHeader title="Notifications" description="Broadcast announcements to businesses on the platform." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Compose" />
          <CardBody>
            <BroadcastComposer businesses={businesses ?? []} />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Sent history" />
          <CardBody>
            {(sent ?? []).length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No broadcasts sent yet.</p>
            ) : (
              <div className="flex flex-col divide-y divide-slate-50">
                {(sent ?? []).map((n: any) => (
                  <div key={n.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-800">{n.title}</p>
                      <span className="text-xs text-slate-400">
                        {new Date(n.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">{n.message}</p>
                    <p className="mt-1 text-xs text-slate-400">To: {n.businesses?.name ?? "Unknown"}</p>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
