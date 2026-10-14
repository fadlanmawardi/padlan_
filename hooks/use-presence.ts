"use client";

import { useEffect, useState } from "react";
import {
  getPresenceMany,
  setPresenceOffline,
  touchPresence,
  type PresenceInfo,
} from "@/services/presence-service";
import { onPresenceChanged } from "@/services/realtime-service";

const HEARTBEAT_MS = 25_000;
const POLL_MS = 10_000;

/**
 * Pantau presence untuk diri sendiri (heartbeat online) sekaligus status
 * user lain dalam `watchKey` (daftar uid yang digabung tanda koma).
 */
export function usePresence(
  uid: string | undefined,
  watchKey: string
): Record<string, PresenceInfo> {
  const [presence, setPresence] = useState<Record<string, PresenceInfo>>({});

  const watchIds = watchKey ? watchKey.split(",") : [];

  useEffect(() => {
    if (!uid) return;

    touchPresence(uid);

    const heartbeat = window.setInterval(() => touchPresence(uid), HEARTBEAT_MS);

    const read = () => setPresence(getPresenceMany(watchIds));
    read();

    const handleUnload = () => setPresenceOffline(uid);
    window.addEventListener("beforeunload", handleUnload);

    const unsubPresence = onPresenceChanged((payload) => {
      if (
        payload.userId === uid ||
        watchIds.includes(payload.userId)
      ) {
        read();
      }
    });

    const poll = window.setInterval(read, POLL_MS);

    return () => {
      window.clearInterval(heartbeat);
      window.clearInterval(poll);
      window.removeEventListener("beforeunload", handleUnload);
      unsubPresence();
      setPresenceOffline(uid);
    };
    // watchKey disengaja sebagai dependency string agar tidak memicu efek
    // saat array referensi baru dibuat.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, watchKey]);

  return presence;
}