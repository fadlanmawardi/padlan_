"use client";

import { useMemo, useState } from "react";
import { Bell, BellRing, CheckCheck, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/components/auth/auth-provider";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  getNotificationPreferences,
  NOTIFICATION_META,
  NOTIFICATION_PREFS_LABELS,
  setNotificationPreference,
} from "@/services/community-service";
import type { NotificationType } from "@/types";

const FILTER_ORDER: NotificationType[] = [
  "attendance",
  "assignment",
  "deadline",
  "grade",
  "announcement",
  "book_due",
  "quiz",
  "material",
  "system",
];

export function NotificationCenter() {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    loaded,
    soundOn,
    markOneRead,
    markAllRead,
    toggleSound,
  } = useRealtimeNotifications(user?.uid);

  const [filter, setFilter] = useState<NotificationType | "all">("all");
  const [prefs, setPrefs] = useState(() =>
    user ? getNotificationPreferences(user.uid) : {}
  );

  const filtered = useMemo(
    () =>
      filter === "all"
        ? notifications
        : notifications.filter((n) => n.type === filter),
    [notifications, filter]
  );

  if (!user) return null;
  if (!loaded) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Notifikasi"
          description="Pemberitahuan tentang tugas, nilai, dan aktivitas sekolah."
        />
        <div className="text-muted-foreground animate-pulse py-16 text-center text-sm">
          Memuat notifikasi…
        </div>
      </div>
    );
  }

  function handleTogglePref(key: NotificationType | "sound", enabled: boolean) {
    if (!user) return;
    if (key === "sound") {
      toggleSound(enabled);
      setPrefs((prev) => ({ ...prev, sound: enabled }));
      return;
    }
    const next = setNotificationPreference(user.uid, key, enabled);
    setPrefs(next);
  }

  const typeChips = FILTER_ORDER.filter(
    (type) => notifications.some((n) => n.type === type)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifikasi"
        description="Pemberitahuan tentang tugas, nilai, dan aktivitas sekolah."
        actions={
          unreadCount > 0 && (
            <Button variant="outline" onClick={() => void markAllRead()}>
              <CheckCheck className="size-4" />
              Tandai semua terbaca
            </Button>
          )
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Belum ada notifikasi"
          description="Semua pemberitahuan akan tampil di sini."
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "cursor-pointer select-none",
                filter === "all" && "bg-primary text-primary-foreground"
              )}
              onClick={() => setFilter("all")}
            >
              Semua
            </Badge>
            {typeChips.map((type) => {
              const meta = NOTIFICATION_META[type];
              return (
                <Badge
                  key={type}
                  variant="outline"
                  className={cn(
                    "cursor-pointer select-none",
                    filter === type && meta.className
                  )}
                  onClick={() => setFilter(type)}
                >
                  {meta.label}
                </Badge>
              );
            })}
          </div>

          <div className="space-y-2">
            {filtered.length === 0 ? (
              <EmptyState
                icon={BellRing}
                title="Tidak ada notifikasi pada filter ini"
                description="Coba pilih kategori lain."
              />
            ) : (
              filtered.map((notification) => {
                const meta = NOTIFICATION_META[notification.type];
                const hasLink = Boolean(notification.link);
                return (
                  <Card
                    key={notification.id}
                    className={cn(
                      "gap-0 py-0 transition-colors",
                      !notification.read && "border-primary/40 bg-primary/[0.03]"
                    )}
                  >
                    <CardContent className="flex items-start gap-3 p-4">
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-full",
                          meta.className
                        )}
                      >
                        <BellRing className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{notification.title}</p>
                          <Badge className={meta.className}>{meta.label}</Badge>
                          {!notification.read && (
                            <span className="bg-primary/15 text-primary rounded-full px-2 py-0.5 text-[10px] font-semibold">
                              Baru
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground mt-0.5 text-sm">
                          {notification.message}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {relativeTime(notification.createdAt)}
                        </p>
                        {hasLink && !notification.read && (
                          <Link
                            href={notification.link!}
                            onClick={() => void markOneRead(notification.id)}
                            className="text-primary mt-1.5 inline-block text-xs font-medium hover:underline"
                          >
                            Buka →
                          </Link>
                        )}
                      </div>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => void markOneRead(notification.id)}
                        >
                          Tandai dibaca
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferensi notifikasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {soundOn ? (
                <Volume2 className="size-4 text-primary" />
              ) : (
                <VolumeX className="text-muted-foreground size-4" />
              )}
              <div>
                <p className="text-sm font-medium">Suara notifikasi</p>
                <p className="text-muted-foreground text-xs">
                  Bunyi saat ada notifikasi baru masuk.
                </p>
              </div>
            </div>
            <Switch
              checked={soundOn}
              onCheckedChange={(value) => handleTogglePref("sound", value)}
            />
          </div>
          {Object.entries(NOTIFICATION_PREFS_LABELS)
            .filter(([key]) => key !== "sound")
            .map(([key, label]) => (
              <div
                key={key}
                className="flex items-center justify-between gap-4"
              >
                <p className="text-sm">{label}</p>
                <Switch
                  checked={prefs[key as NotificationType] !== false}
                  onCheckedChange={(value) =>
                    handleTogglePref(key as NotificationType, value)
                  }
                />
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
