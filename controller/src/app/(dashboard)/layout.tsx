import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/supabase/current-admin";
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
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { count: pendingApprovals } = await supabase
    .from("businesses")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <ToastProvider>
      <IdleLogout />
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <Topbar email={admin.email} pendingApprovals={pendingApprovals ?? 0} />
          <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
