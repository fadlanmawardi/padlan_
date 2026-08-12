"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getNotificationsForUser,
  isNotificationCategoryEnabled,
  isSoundEnabled,
  markAllNotificationsRead,
  markNotificationRead,
  setSoundEnabled,
} from "@/services/community-service";
import {
  broadcastSupported,
  dataChanged,
  onUserNotification,
  subscribe,
} from "@/services/realtime-service";
import type { DataChangedPayload } from "@/services/realtime-service";
import type { AppNotification } from "@/types";

/** Mainkan nada singkat ber-voice lembut (tanpa error autoplay). */
function playNotificationSound(): void {
  try {
    if (typeof window === "undefined") return;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.55);
    void ctx.resume().catch(() => undefined);
  } catch {
    // abaikan bila audio tidak tersedia / diblokir
  }
}

const POLL_INTERVAL_MS = 30_000;

export function useRealtimeNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [soundOn, setSoundOn] = useState(
    userId ? isSoundEnabled(userId) : false
  );
  const userIdRef = useRef(userId);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  const load = useCallback(async () => {
    if (!userIdRef.current) return;
    const list = await getNotificationsForUser(userIdRef.current);
    setNotifications(list);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void load();
  }, [load, userId]);

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = onUserNotification(userId, (notification) => {
      setNotifications((prev) => [
        notification,
        ...prev.filter((n) => n.id !== notification.id),
      ]);
      if (
        isSoundEnabled(userId) &&
        isNotificationCategoryEnabled(userId, notification.type)
      ) {
        playNotificationSound();
      }
      toast(notification.title, {
        description: notification.message,
        id: `ntf-${notification.id}`,
      });
    });

    const unsubscribeData = subscribe<DataChangedPayload>("data-changed", (event) => {
      if (
        event.payload?.scope === "notification" &&
        event.payload?.detail === userId
      ) {
        void load();
      }
    });

    const pollTimer = window.setInterval(() => {
      if (!broadcastSupported()) void load();
    }, POLL_INTERVAL_MS);

    return () => {
      unsubscribe();
      unsubscribeData();
      window.clearInterval(pollTimer);
    };
  }, [userId, load]);

  const markOneRead = useCallback(async (id: string) => {
    if (!userIdRef.current) return;
    await markNotificationRead(id, userIdRef.current);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllRead = useCallback(async () => {
    if (!userIdRef.current) return;
    await markAllNotificationsRead(userIdRef.current);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const toggleSound = useCallback(
    (enabled: boolean) => {
      if (!userIdRef.current) return;
      setSoundEnabled(userIdRef.current, enabled);
      setSoundOn(enabled);
    },
    []
  );

  /** Beri tahu layanan agar UI lain ikut menyegarkan (mis. setelah reload). */
  const sync = useCallback(() => {
    if (!userIdRef.current) return;
    dataChanged("notification", userIdRef.current);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    loaded,
    soundOn,
    markOneRead,
    markAllRead,
    toggleSound,
    sync,
    reload: load,
  };
}
