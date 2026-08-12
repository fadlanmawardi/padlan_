"use client";

import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/auth/auth-provider";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { NOTIFICATION_META } from "@/services/community-service";
import { BellRing } from "lucide-react";

export function NotificationMenu() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markOneRead, markAllRead } =
    useRealtimeNotifications(user?.uid);

  const list = notifications.slice(0, 8);
  const baseHref = `/${user?.role ?? "student"}`;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifikasi"
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="text-sm font-medium">Notifikasi</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-2 text-xs"
              onClick={() => void markAllRead()}
            >
              <CheckCheck className="size-3.5" />
              Semua dibaca
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {list.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <BellRing className="text-muted-foreground mx-auto mb-2 size-6" />
            <p className="text-sm text-muted-foreground">
              Belum ada notifikasi
            </p>
          </div>
        ) : (
          list.map((notification) => {
            const meta = NOTIFICATION_META[notification.type];
            return (
              <DropdownMenuItem
                key={notification.id}
                className="items-start gap-2.5 py-2.5"
                onClick={() => void markOneRead(notification.id)}
                asChild={!!notification.link}
              >
                {notification.link ? (
                  <Link
                    href={notification.link}
                    className="flex items-start gap-2.5"
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full",
                        meta.className
                      )}
                    >
                      <BellRing className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-sm font-medium",
                          !notification.read && "text-primary"
                        )}
                      >
                        {notification.title}
                      </span>
                      <span className="text-muted-foreground block text-xs leading-snug">
                        {notification.message}
                      </span>
                      <span className="text-muted-foreground mt-0.5 block text-[11px]">
                        {relativeTime(notification.createdAt)}
                      </span>
                    </span>
                    {!notification.read && (
                      <span className="bg-primary mt-1 size-2 shrink-0 rounded-full" />
                    )}
                  </Link>
                ) : (
                  <>
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full",
                        meta.className
                      )}
                    >
                      <BellRing className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {notification.title}
                      </span>
                      <span className="text-muted-foreground block text-xs leading-snug">
                        {notification.message}
                      </span>
                      <span className="text-muted-foreground mt-0.5 block text-[11px]">
                        {relativeTime(notification.createdAt)}
                      </span>
                    </span>
                  </>
                )}
              </DropdownMenuItem>
            );
          })
        )}
        <DropdownMenuSeparator />
        <Link
          href={`${baseHref}/notifications`}
          onClick={() => setOpen(false)}
          className="text-muted-foreground hover:text-foreground block px-3 py-2 text-center text-xs font-medium"
        >
          Lihat semua notifikasi
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
