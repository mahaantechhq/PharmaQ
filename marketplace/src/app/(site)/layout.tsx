import { getCurrentBusiness } from "@/lib/supabase/current-business";
import { createClient } from "@/lib/supabase/server";
import { getCartSummary, type CartSummary } from "@/lib/checkout";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { TrustBadges } from "@/components/layout/TrustBadges";
import { ToastProvider } from "@/components/ui/Toast";
import { IdleLogout } from "@/components/auth/IdleLogout";
import { CartProvider } from "@/components/cart/CartContext";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCurrentBusiness();

  let cartSummary: CartSummary | null = null;
  let unreadCount = 0;

  if (ctx) {
    const supabase = await createClient();
    const [summary, { count: unread }] = await Promise.all([
      getCartSummary(ctx.business.id),
      supabase.from("notifications").select("id", { count: "exact", head: true }).eq("business_id", ctx.business.id).eq("is_read", false),
    ]);
    cartSummary = summary;
    unreadCount = unread ?? 0;
  }

  return (
    <ToastProvider>
      <CartProvider initialSummary={cartSummary}>
        <IdleLogout enabled={!!ctx} />
        {!ctx && <AnnouncementBar />}
        <Navbar businessName={ctx?.business.name ?? null} unreadCount={unreadCount} />
        <main className="flex-1">{children}</main>
        <TrustBadges />
        <Footer />
      </CartProvider>
    </ToastProvider>
  );
}
