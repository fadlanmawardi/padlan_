import type {
  AppUser,
  ChatAttachment,
  ChatConversation,
  ChatMessage,
  ChatSearchResult,
  ConversationSummary,
} from "@/types";
import {
  chatConversationIdFor,
  dbChatData,
  dbUsers,
  delay,
  findByUser,
  persistChatDb,
  syncChatDbFromStorage,
} from "./store";
import {
  chatDelivered,
  chatHidden,
  chatMessageSent,
  chatRead,
  chatTyping,
} from "./realtime-service";

const MAX_MESSAGE_LENGTH = 2000;

export class ChatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatError";
  }
}

/**
 * Sanitasi isi pesan: buang karakter kontrol, pertahankan line-break,
 * batasi panjang, dan hilangkan spasi berlebih di awal/akhir.
 * Tag HTML tidak perlu di-escape di sini karena React meng-escape teks.
 */
function sanitizeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);
}

function nowIso(): string {
  return new Date().toISOString();
}

function sanitizeAttachment(
  attachment: ChatAttachment | null | undefined
): ChatAttachment | null {
  if (!attachment) return null;
  const name = sanitizeText(attachment.name);
  if (!name) return null;
  return {
    name,
    sizeKb: Math.max(0, Math.floor(Number(attachment.sizeKb) || 0)),
    type:
      attachment.type === "image" || attachment.type === "document"
        ? attachment.type
        : "file",
    mime:
      typeof attachment.mime === "string" ? attachment.mime.slice(0, 100) : undefined,
  };
}

/** Id unik global (anti-bentrok antar-tab) dengan prefix. */
function uniqueId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${rand}`;
}

function sync(): void {
  syncChatDbFromStorage();
}

function persist(): void {
  persistChatDb();
}

function cloneMessage(message: ChatMessage): ChatMessage {
  return { ...message, deletedFor: [...(message.deletedFor ?? [])] };
}

function conversationForPair(userA: string, userB: string): ChatConversation {
  const id = chatConversationIdFor(userA, userB);
  let convo = dbChatData.conversations.find((c) => c.id === id);
  if (!convo) {
    const now = nowIso();
    convo = {
      id,
      participants: [userA, userB].sort(),
      lastMessage: "",
      lastMessageAt: "",
      lastSenderId: "",
      createdAt: now,
      updatedAt: now,
      deletedFor: [],
    };
    dbChatData.conversations.push(convo);
  }
  return convo;
}

/* ===================== Daftar user & percakapan ===================== */

/** Semua user aktif yang bisa diajak chat (kecuali diri sendiri). */
export async function getChatUsers(currentUid: string): Promise<AppUser[]> {
  sync();
  await delay(200);
  return dbUsers
    .filter((u) => u.uid !== currentUid && u.status === "active")
    .map((u) => ({ ...u }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Daftar percakapan milik `currentUid`, diurutkan aktivitas terakhir. */
export async function getConversations(
  currentUid: string
): Promise<ConversationSummary[]> {
  sync();
  await delay(250);

  const usersById = new Map(dbUsers.map((u) => [u.uid, u]));
  const result: ConversationSummary[] = [];

  for (const convo of dbChatData.conversations) {
    if (!convo.participants.includes(currentUid)) continue;
    if (convo.deletedFor?.includes(currentUid)) continue;
    if (!convo.lastMessageAt) continue;

    const otherId =
      convo.participants.find((p) => p !== currentUid) ?? "";
    const other = usersById.get(otherId);
    if (!other) continue;

    const unreadCount = dbChatData.messages.filter(
      (m) =>
        m.conversationId === convo.id &&
        m.receiverId === currentUid &&
        !m.readAt &&
        !m.deletedFor?.includes(currentUid)
    ).length;

    result.push({
      conversationId: convo.id,
      userId: otherId,
      name: other.name,
      role: other.role,
      className: other.className,
      photoUrl: other.photoUrl,
      lastMessage: convo.lastMessage,
      lastMessageAt: convo.lastMessageAt,
      lastMessageFromMe: convo.lastSenderId === currentUid,
      unreadCount,
    });
  }

  return result.sort((a, b) =>
    b.lastMessageAt.localeCompare(a.lastMessageAt)
  );
}

/* ===================== Pesan & status ===================== */

/**
 * Tandai semua pesan dari `otherId` yang masuk ke `userId` sebagai
 * "delivered" (sampai di perangkat) — bukan read.
 */
export async function markConversationDelivered(
  userId: string,
  otherId: string
): Promise<void> {
  sync();
  await delay(60);
  const conversationId = chatConversationIdFor(userId, otherId);
  const delivered = nowIso();
  let changed = false;
  for (const msg of dbChatData.messages) {
    if (msg.conversationId !== conversationId) continue;
    if (msg.receiverId !== userId || msg.senderId !== otherId) continue;
    if (msg.status === "sent") {
      msg.deliveredAt = delivered;
      msg.status = "delivered";
      msg.updatedAt = delivered;
      changed = true;
    }
  }
  if (changed) {
    persist();
    chatDelivered(userId, otherId);
  }
}

/**
 * Tandai semua pesan dari `otherId` yang masuk ke `userId` sebagai sudah
 * dibaca, lalu beri tahu pengirim lewat event realtime.
 */
export async function markConversationRead(
  userId: string,
  otherId: string
): Promise<void> {
  sync();
  await delay(80);
  const conversationId = chatConversationIdFor(userId, otherId);
  const at = nowIso();
  let readyRead = false;
  let readyDelivered = false;
  for (const msg of dbChatData.messages) {
    if (msg.conversationId !== conversationId) continue;
    if (msg.receiverId !== userId || msg.senderId !== otherId) continue;
    if (!msg.deliveredAt) {
      msg.deliveredAt = at;
      readyDelivered = true;
    }
    if (msg.status !== "read") {
      msg.readAt = at;
      msg.status = "read";
      msg.updatedAt = at;
      readyRead = true;
    }
  }
  if (readyRead || readyDelivered) persist();
  if (readyRead) {
    chatRead(userId, otherId);
  } else if (readyDelivered) {
    chatDelivered(userId, otherId);
  }
}

/** Riwayat pesan satu percakapan (ascending), sekaligus menandai read. */
export async function getMessages(
  userId: string,
  otherId: string
): Promise<ChatMessage[]> {
  sync();
  await delay(250);
  const conversationId = chatConversationIdFor(userId, otherId);

  const convo = dbChatData.conversations.find((c) => c.id === conversationId);
  if (convo && convo.deletedFor?.includes(userId)) {
    // Membuka kembali percakapan yang sebelumnya disembunyikan untuk saya.
    convo.deletedFor = (convo.deletedFor ?? []).filter((id) => id !== userId);
    persist();
  }

  const list = dbChatData.messages
    .filter(
      (m) =>
        m.conversationId === conversationId &&
        !m.deletedFor?.includes(userId)
    )
    .sort(
      (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
    );

  await markConversationRead(userId, otherId);
  return list.map(cloneMessage);
}

/* ===================== Kirim pesan ===================== */

export interface SendMessageInput {
  senderId: string;
  receiverId: string;
  text: string;
  replyToId?: string | null;
  attachment?: ChatAttachment | null;
}

/**
 * Kirim pesan baru. `senderId` diambil dari sesi login di UI; service tetap
 * memvalidasi pengirim != penerima, penerima terdaftar, dan isi pesan bersih.
 */
export async function sendMessage(input: SendMessageInput): Promise<ChatMessage> {
  sync();
  await delay(300);

  const { senderId, receiverId, replyToId } = input;
  if (senderId === receiverId) {
    throw new ChatError("Tidak dapat mengirim pesan ke diri sendiri");
  }
  if (!senderId || !receiverId) {
    throw new ChatError("Data pengirim/penerima tidak lengkap");
  }
  const receiver = findByUser(receiverId);
  if (!receiver) {
    throw new ChatError("Penerima tidak ditemukan");
  }
  const cleaned = sanitizeText(input.text);
  const attachment = sanitizeAttachment(input.attachment);
  if (!cleaned && !attachment) {
    throw new ChatError("Pesan atau lampiran tidak boleh kosong");
  }

  const convo = conversationForPair(senderId, receiverId);
  // Pesan baru "membuka kembali" percakapan untuk kedua pihak
  // (menghilangkan status soft-delete).
  convo.deletedFor = (convo.deletedFor ?? []).filter(
    (id) => id !== senderId && id !== receiverId
  );

  const at = nowIso();
  const message: ChatMessage = {
    id: uniqueId("msg"),
    conversationId: convo.id,
    senderId,
    receiverId,
    message: cleaned,
    createdAt: at,
    updatedAt: at,
    status: "sent",
    readAt: null,
    deliveredAt: null,
    replyToId: replyToId ?? null,
    deletedFor: [],
    attachment,
  };

  dbChatData.messages.push(message);
  convo.lastMessage = attachment && !cleaned ? `📎 ${attachment.name}` : cleaned;
  convo.lastMessageAt = at;
  convo.lastSenderId = senderId;
  convo.updatedAt = at;
  persist();

  chatMessageSent({ ...message });
  return cloneMessage(message);
}

/** Jumlah pesan masuk yang belum dibaca (untuk badge/indikator). */
export async function getUnreadChatCount(userId: string): Promise<number> {
  sync();
  await delay(100);
  const hiddenConvos = new Set(
    dbChatData.conversations
      .filter((c) => c.deletedFor?.includes(userId))
      .map((c) => c.id)
  );
  return dbChatData.messages.filter(
    (m) =>
      m.receiverId === userId &&
      !m.readAt &&
      !m.deletedFor?.includes(userId) &&
      !hiddenConvos.has(m.conversationId)
  ).length;
}

/* ===================== Reply, Typing, Hapus ===================== */

/** Beri tahu lawan bicara bahwa user sedang mengetik (tidak dipersist). */
export function notifyTyping(
  conversationId: string,
  userId: string,
  typing: boolean
): void {
  chatTyping(conversationId, userId, typing);
}

/**
 * "Hapus untuk saya" pada satu pesan: pesan disembunyikan dari tampilan
 * `userId` saja. Data asli tidak pernah dihapus dari penyimpanan.
 */
export async function hideMessageForMe(
  userId: string,
  messageId: string
): Promise<void> {
  sync();
  await delay(80);
  const msg = dbChatData.messages.find(
    (m) =>
      m.id === messageId &&
      (m.senderId === userId || m.receiverId === userId)
  );
  if (!msg) return;
  msg.deletedFor = [...(msg.deletedFor ?? []), userId];
  msg.updatedAt = nowIso();
  persist();
  chatHidden(userId, msg.conversationId, [msg.id]);
}

/**
 * "Hapus untuk saya" pada satu percakapan: percakapan disembunyikan dari
 * daftar `userId` saja. Riwayat pesan tetap utuh bagi lawan bicara.
 */
export async function hideConversationForMe(
  userId: string,
  conversationId: string
): Promise<void> {
  sync();
  await delay(80);
  const convo = dbChatData.conversations.find(
    (c) => c.id === conversationId && c.participants.includes(userId)
  );
  if (!convo) return;
  convo.deletedFor = [...(convo.deletedFor ?? []), userId];
  convo.updatedAt = nowIso();
  persist();
  chatHidden(userId, conversationId);
}

/* ===================== Pencarian ===================== */

/** Cari isi pesan lama di dalam percakapan milik `userId`. */
export async function searchMessages(
  userId: string,
  query: string
): Promise<ChatSearchResult[]> {
  sync();
  await delay(150);
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const usersById = new Map(dbUsers.map((u) => [u.uid, u]));
  const hiddenConvos = new Set(
    dbChatData.conversations
      .filter((c) => c.deletedFor?.includes(userId))
      .map((c) => c.id)
  );
  const results: ChatSearchResult[] = [];

  for (const msg of dbChatData.messages) {
    if (msg.senderId !== userId && msg.receiverId !== userId) continue;
    if (msg.deletedFor?.includes(userId)) continue;
    if (hiddenConvos.has(msg.conversationId)) continue;
    if (!msg.message.toLowerCase().includes(q)) continue;

    const convo = dbChatData.conversations.find(
      (c) => c.id === msg.conversationId
    );
    if (!convo) continue;
    const peerId = convo.participants.find((p) => p !== userId) ?? "";

    results.push({
      conversationId: msg.conversationId,
      messageId: msg.id,
      message: msg.message,
      createdAt: msg.createdAt,
      senderName: usersById.get(msg.senderId)?.name ?? "Pengguna",
      peerName: usersById.get(peerId)?.name ?? "Pengguna",
      peerId,
    });
  }

  return results
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 60);
}

/** Nama singkat user untuk UI (fallback bila user sudah dihapus). */
export function getChatUserName(userId: string): string {
  sync();
  return findByUser(userId)?.name ?? "Pengguna dihapus";
}