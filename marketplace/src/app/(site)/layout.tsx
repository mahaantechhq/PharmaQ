import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ToastProvider } from "@/components/ui/Toast";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCurrentBusiness();

  let cartCount = 0;
  let unreadCount = 0;

  if (ctx) {
    const supabase = await createClient();
    const [{ count: cart }, { count: unread }] = await Promise.all([
      supabase.from("cart_items").select("id", { count: "exact", head: true }).eq("buyer_business_id", ctx.business.id),
      supabase.from("notifications").select("id", { count: "exact", head: true }).eq("business_id", ctx.business.id).eq("is_read", false),
    ]);
    cartCount = cart ?? 0;
    unreadCount = unread ?? 0;
  }

  return (
    <ToastProvider>
      <Navbar businessName={ctx?.business.name ?? null} cartCount={cartCount} unreadCount={unreadCount} />
      <main className="flex-1">{children}</main>
      <Footer />
    </ToastProvider>
  );
}
