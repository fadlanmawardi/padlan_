import type { AppNotification, ChatMessage } from "@/types";

/**
 * Layanan realtime ringan untuk mode demo SchoolHub.
 *
 * Strategi yang digunakan (aman untuk lingkungan demo):
 * 1. Event emitter lokal — semua subscriber dalam satu tab mendapat event.
 * 2. BroadcastChannel — menyebarkan event ke tab lain dari browser yang sama.
 * 3. Polling ringan — fallback bagi browser tanpa BroadcastChannel.
 *
 * Tidak ada dependency tambahan dan aman digunakan tanpa server.
 */

export type RealtimeEventType =
  | "notification"
  | "attendance"
  | "assignment"
  | "submission"
  | "announcement"
  | "loan"
  | "grade"
  | "achievement"
  | "chat"
  | "chat-read"
  | "chat-delivered"
  | "chat-hidden"
  | "typing"
  | "presence"
  | "data-changed";

export interface RealtimeEvent<T = unknown> {
  type: RealtimeEventType;
  payload: T;
  timestamp: number;
  source: string;
}

export interface NotificationEventPayload {
  notification: AppNotification;
}

export interface DataChangedPayload {
  scope: string;
  detail?: string;
}

export interface ChatMessageEventPayload {
  message: ChatMessage;
}

export interface ChatReadEventPayload {
  /** Pembaca pesan (user yang membuka percakapan). */
  readerId: string;
  /** Lawan bicara dari pembaca (pengirim asli). */
  partnerId: string;
  readAt: string;
}

export interface ChatDeliveredEventPayload {
  /** Perangkat penerima yang menerima pesan. */
  delivererId: string;
  /** Pengirim asli (untuk diteruskan ke status pesannya). */
  partnerId: string;
  deliveredAt: string;
}

export interface ChatHiddenEventPayload {
  /** User yang menghapus chat untuk dirinya sendiri. */
  userId: string;
  conversationId: string;
  messageIds?: string[];
}

export interface TypingEventPayload {
  conversationId: string;
  userId: string;
  typing: boolean;
}

export interface PresenceEventPayload {
  userId: string;
  online: boolean;
  at: string;
}

type Listener<T = unknown> = (event: RealtimeEvent<T>) => void;

const CHANNEL_NAME = "schoolhub-realtime-v1";

/* ----------------------- event emitter lokal ----------------------- */

const localListeners = new Map<RealtimeEventType, Set<Listener>>();

function emitLocal<T>(event: RealtimeEvent<T>): void {
  const listeners = localListeners.get(event.type);
  if (!listeners) return;
  for (const listener of listeners) {
    try {
      (listener as Listener<T>)(event);
    } catch {
      // jangan biarkan satu listener merusak yang lain
    }
  }
}

/* ----------------------- BroadcastChannel ----------------------- */

let channel: BroadcastChannel | null = null;
let channelSupported = false;

function getChannel(): BroadcastChannel | null {
  if (channel) return channel;
  if (typeof BroadcastChannel !== "undefined") {
    channelSupported = true;
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (message: MessageEvent) => {
      const event = message.data as RealtimeEvent | null;
      if (event?.type) {
        emitLocal(event);
      }
    };
    return channel;
  }
  return null;
}

export function broadcastSupported(): boolean {
  if (typeof BroadcastChannel !== "undefined") return true;
  return channelSupported;
}

/* ----------------------- API publik ----------------------- */

export function emit<T>(type: RealtimeEventType, payload: T): void {
  const event: RealtimeEvent<T> = {
    type,
    payload,
    timestamp: Date.now(),
    source: `tab-${Math.random().toString(36).slice(2)}`,
  };
  emitLocal(event);
  const active = getChannel();
  if (active) {
    try {
      active.postMessage(event);
    } catch {
      // abaikan jika channel gagal mengirim
    }
  }
}

export function subscribe<T = unknown>(
  type: RealtimeEventType,
  listener: Listener<T>
): () => void {
  let set = localListeners.get(type);
  if (!set) {
    set = new Set();
    localListeners.set(type, set);
  }
  set.add(listener as Listener);

  // Aktifkan channel supaya event antar-tab bisa diterima.
  getChannel();

  return () => {
    const current = localListeners.get(type);
    if (current) {
      current.delete(listener as Listener);
      if (current.size === 0) localListeners.delete(type);
    }
  };
}

/** Subscriber hanya menerima notifikasi milik `userId` tertentu. */
export function onUserNotification(
  userId: string,
  handler: (notification: AppNotification) => void
): () => void {
  return subscribe<NotificationEventPayload>("notification", (event) => {
    const notification = event.payload?.notification;
    if (notification && notification.userId === userId) {
      handler(notification);
    }
  });
}

/** Emit notifikasi + beri tahu semua listener. */
export function notify(userId: string, notification: AppNotification): void {
  emit<NotificationEventPayload>("notification", { notification });
  emit<DataChangedPayload>("data-changed", {
    scope: "notification",
    detail: userId,
  });
}

/** Emit perubahan data umum agar UI dapat menyegarkan dirinya. */
export function dataChanged(scope: string, detail?: string): void {
  emit<DataChangedPayload>("data-changed", { scope, detail });
}

/* ===================== Chat realtime ===================== */

/** Sebarkan pesan chat baru ke semua tab/browser yang mendengarkan. */
export function chatMessageSent(message: ChatMessage): void {
  emit<ChatMessageEventPayload>("chat", { message });
  emit<DataChangedPayload>("data-changed", {
    scope: "chat",
    detail: message.receiverId,
  });
}

/**
 * Subscriber hanya menerima pesan yang melibatkan `forUserId`
 * (sebagai pengirim maupun penerima).
 */
export function onChatMessage(
  forUserId: string,
  handler: (message: ChatMessage) => void
): () => void {
  return subscribe<ChatMessageEventPayload>("chat", (event) => {
    const message = event.payload?.message;
    if (!message) return;
    if (message.senderId === forUserId || message.receiverId === forUserId) {
      handler(message);
    }
  });
}

/** Beri tahu pengirim bahwa pesannya sudah dibaca penerima. */
export function chatRead(readerId: string, partnerId: string): void {
  emit<ChatReadEventPayload>("chat-read", {
    readerId,
    partnerId,
    readAt: new Date().toISOString(),
  });
  emit<DataChangedPayload>("data-changed", {
    scope: "chat",
    detail: partnerId,
  });
}

export function onChatRead(handler: (payload: ChatReadEventPayload) => void): () => void {
  return subscribe<ChatReadEventPayload>("chat-read", (event) => {
    if (event.payload) handler(event.payload);
  });
}

/** Beri tahu pengirim bahwa pesannya sudah sampai ke penerima. */
export function chatDelivered(
  delivererId: string,
  partnerId: string
): void {
  emit<ChatDeliveredEventPayload>("chat-delivered", {
    delivererId,
    partnerId,
    deliveredAt: new Date().toISOString(),
  });
  emit<DataChangedPayload>("data-changed", {
    scope: "chat",
    detail: partnerId,
  });
}

export function onChatDelivered(
  handler: (payload: ChatDeliveredEventPayload) => void
): () => void {
  return subscribe<ChatDeliveredEventPayload>("chat-delivered", (event) => {
    if (event.payload) handler(event.payload);
  });
}

/** Beri tahu tab lain milik user yang sama bahwa sebagian chat disembunyikan. */
export function chatHidden(
  userId: string,
  conversationId: string,
  messageIds?: string[]
): void {
  emit<ChatHiddenEventPayload>("chat-hidden", {
    userId,
    conversationId,
    messageIds,
  });
}

export function onChatHidden(
  handler: (payload: ChatHiddenEventPayload) => void
): () => void {
  return subscribe<ChatHiddenEventPayload>("chat-hidden", (event) => {
    if (event.payload) handler(event.payload);
  });
}

/* ===================== Typing indicator ===================== */

export function chatTyping(
  conversationId: string,
  userId: string,
  typing: boolean
): void {
  emit<TypingEventPayload>("typing", {
    conversationId,
    userId,
    typing,
  });
}

export function onChatTyping(
  handler: (payload: TypingEventPayload) => void
): () => void {
  return subscribe<TypingEventPayload>("typing", (event) => {
    if (event.payload) handler(event.payload);
  });
}

/* ===================== Presence (online/offline) ===================== */

export function presenceChanged(userId: string, online: boolean): void {
  emit<PresenceEventPayload>("presence", {
    userId,
    online,
    at: new Date().toISOString(),
  });
}

export function onPresenceChanged(
  handler: (payload: PresenceEventPayload) => void
): () => void {
  return subscribe<PresenceEventPayload>("presence", (event) => {
    if (event.payload) handler(event.payload);
  });
}
