"use client";

import { useRouter } from "next/navigation";
import { Bell, CheckCheck, CreditCard, Package, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { markAllNotificationsRead, markNotificationRead } from "@/app/(site)/notifications/actions";
import { formatDateTime } from "@/lib/format";
import type { Notification, NotificationType } from "@/lib/types/database";

const ICONS: Record<NotificationType, typeof Bell> = {
  order: ShoppingBag,
  system: Bell,
  wallet: CreditCard,
  inventory: Package,
};

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  const router = useRouter();
  const hasUnread = notifications.some((n) => !n.is_read);

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    router.refresh();
  };

  const handleMarkOne = async (id: string) => {
    await markNotificationRead(id);
    router.refresh();
  };

  return (
    <div>
      {hasUnread && (
        <div className="mb-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={handleMarkAll}>
            <CheckCheck className="h-4 w-4" /> Mark all as read
          </Button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-24 text-slate-400">
          <Bell className="h-8 w-8" />
          <p className="text-sm">You&apos;re all caught up.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-slate-50">
          {notifications.map((n) => {
            const Icon = ICONS[n.type];
            return (
              <button
                key={n.id}
                onClick={() => !n.is_read && handleMarkOne(n.id)}
                className={`flex items-start gap-3 py-3.5 text-left ${!n.is_read ? "-mx-2 rounded-lg bg-primary-50/40 px-2" : ""}`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-800">{n.title}</p>
                    {!n.is_read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-600" />}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatDateTime(n.created_at, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
