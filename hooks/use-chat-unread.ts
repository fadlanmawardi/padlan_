"use client";

import { useEffect, useState } from "react";
import { getUnreadChatCount } from "@/services/chat-service";
import { onChatMessage, onChatRead } from "@/services/realtime-service";

/**
 * Jumlah total pesan chat yang belum dibaca oleh `userId`.
 * Diperbarui realtime: saat pesan masuk maupun saat lawan bicara
 * membalas / menandai dibaca.
 */
export function useChatUnreadCount(userId?: string): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let active = true;

    const refresh = async () => {
      try {
        const value = await getUnreadChatCount(userId);
        if (active) setCount(value);
      } catch {
        // abaikan saat layanan gagal
      }
    };

    void refresh();

    const unsubMessage = onChatMessage(userId, () => void refresh());
    const unsubRead = onChatRead((payload) => {
      if (payload.partnerId === userId) void refresh();
    });

    const poll = window.setInterval(() => void refresh(), 30_000);

    return () => {
      active = false;
      unsubMessage();
      unsubRead();
      window.clearInterval(poll);
    };
  }, [userId]);

  return count;
}