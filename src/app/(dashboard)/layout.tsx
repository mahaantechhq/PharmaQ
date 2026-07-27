import { redirect } from "next/navigation";
import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ToastProvider } from "@/components/ui/Toast";
import { IdleLogout } from "@/components/auth/IdleLogout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getCurrentBusiness();

  if (!ctx) {
    redirect("/login");
  }

  const supabase = await createClient();
  const [{ count: unreadCount }, { count: newOrdersCount }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("business_id", ctx.business.id)
      .eq("is_read", false),
    supabase
      .from("supplier_orders")
      .select("id", { count: "exact", head: true })
      .eq("supplier_business_id", ctx.business.id)
      .eq("status", "placed"),
  ]);

  return (
    <ToastProvider>
      <IdleLogout />
      <div className="flex min-h-screen bg-background">
        <Sidebar business={ctx.business} newOrdersCount={newOrdersCount ?? 0} />
        <div className="flex-1 min-w-0">
          <Topbar business={ctx.business} owner={ctx.owner} unreadCount={unreadCount ?? 0} />
          <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
