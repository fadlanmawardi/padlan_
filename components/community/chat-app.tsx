"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  FileText,
  Loader2,
  MessageCircle,
  MessageSquarePlus,
  MoreVertical,
  Paperclip,
  Search,
  Send,
  Smile,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getChatUsers,
  getConversations,
  getMessages,
  hideConversationForMe,
  hideMessageForMe,
  markConversationDelivered,
  markConversationRead,
  notifyTyping,
  searchMessages,
  sendMessage,
} from "@/services/chat-service";
import { chatConversationIdFor } from "@/services/store";
import {
  onChatDelivered,
  onChatHidden,
  onChatMessage,
  onChatRead,
  onChatTyping,
} from "@/services/realtime-service";
import { usePresence } from "@/hooks/use-presence";
import { getInitials, relativeTime, formatDate } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type {
  AppUser,
  ChatAttachment,
  ChatMessage,
  ChatSearchResult,
  ConversationSummary,
} from "@/types";

type SearchMode = "chats" | "users" | "messages";

const EMOJIS = [
  "😀", "😁", "😂", "🤣", "😊", "😇", "🙂", "😉", "😍", "😘",
  "😜", "🤪", "🤗", "🤔", "🤨", "😐", "😑", "😶", "😏", "😒",
  "🙄", "😬", "😴", "🤤", "😪", "😮", "😲", "🥺", "🥰", "😎",
  "🤓", "🧐", "😭", "😤", "😡", "🤬", "🥳", "🥴", "🤯", "😱",
  "😓", "😥", "😢", "😞", "😔", "😟", "🤒", "🤕", "🤠", "😈",
  "👻", "☠️", "💀", "👽", "🤖", "💩", "🙏", "👍", "👎", "👊",
  "🤝", "💪", "👏", "🙌", "✌️", "🤞", "👀", "❤️", "💔", "💕",
  "💯", "💥", "🔥", "✨", "🎉", "🎂", "🌹", "🌝", "⭐", "⚡",
  "🚀", "🌈",
] as const;

const TYPING_TIMEOUT_MS = 4000;
const TYPING_EMIT_INTERVAL_MS = 2500;

function timeLabel(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function isSameDay(a: string, b: string): boolean {
  return dayKey(a) === dayKey(b);
}

function daySeparator(iso: string): string {
  const today = dayKey(new Date().toISOString());
  const yesterday = dayKey(
    new Date(Date.now() - 86_400_000).toISOString()
  );
  const key = dayKey(iso);
  if (key === today) return "Hari ini";
  if (key === yesterday) return "Kemarin";
  return formatDate(iso);
}

function isRecentTyping(at: number): boolean {
  return at > 0 && Date.now() - at < TYPING_TIMEOUT_MS;
}

/** Potong teks jadi beberapa bagian dengan kata kunci yang disorot. */
function highlightParts(text: string, query: string): string[] {
  const lowerText = text.toLowerCase();
  const q = query.trim().toLowerCase();
  if (!q) return [text];
  const parts: string[] = [];
  let cursor = 0;
  let index = lowerText.indexOf(q, cursor);
  while (index !== -1) {
    if (index > cursor) parts.push(text.slice(cursor, index));
    parts.push(text.slice(index, index + q.length));
    cursor = index + q.length;
    index = lowerText.indexOf(q, cursor);
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

export function ChatApp() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [pendingAttachment, setPendingAttachment] = useState<
    ChatAttachment | null
  >(null);

  const [search, setSearch] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("chats");
  const [searchResults, setSearchResults] = useState<ChatSearchResult[]>([]);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");

  const [typingUsers, setTypingUsers] = useState<Record<string, number>>({});

  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastTypingSentRef = useRef(0);
  const activeIdRef = useRef(activeId);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const activeConvoId = useMemo(
    () => (uid && activeId ? chatConversationIdFor(uid, activeId) : null),
    [uid, activeId]
  );

  /* ===================== Load data awal ===================== */

  const loadConversations = useCallback(async () => {
    if (!uid) return;
    try {
      const list = await getConversations(uid);
      setConversations(list);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat percakapan");
    } finally {
      setLoadingConvs(false);
    }
  }, [uid]);

  const loadUsers = useCallback(async () => {
    if (!uid) return;
    try {
      const list = await getChatUsers(uid);
      setUsers(list);
    } catch {
      // bunga list user hanya opsional
    }
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    void loadConversations();
    void loadUsers();
  }, [uid, loadConversations, loadUsers]);

  /* ===================== Realtime ===================== */

  useEffect(() => {
    if (!uid) return;

    const unsubMessage = onChatMessage(uid, (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      const peer = msg.senderId === uid ? msg.receiverId : msg.senderId;
      if (msg.receiverId === uid) {
        if (peer === activeIdRef.current) {
          void markConversationRead(uid, peer);
        } else {
          void markConversationDelivered(uid, peer);
        }
      }
      void loadConversations();
    });

    const unsubDelivered = onChatDelivered((payload) => {
      if (!uid || payload.partnerId !== uid) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.senderId === uid &&
          m.receiverId === payload.delivererId &&
          m.status === "sent"
            ? { ...m, status: "delivered", deliveredAt: payload.deliveredAt }
            : m
        )
      );
    });

    const unsubRead = onChatRead((payload) => {
      if (!uid || payload.partnerId !== uid) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.senderId === uid &&
          m.receiverId === payload.readerId &&
          m.status !== "read"
            ? {
                ...m,
                status: "read",
                readAt: payload.readAt,
                deliveredAt: m.deliveredAt ?? payload.readAt,
              }
            : m
        )
      );
    });

    const unsubTyping = onChatTyping((payload) => {
      if (
        !uid ||
        payload.conversationId !==
          (activeIdRef.current && uid
            ? chatConversationIdFor(uid, activeIdRef.current)
            : null)
      ) {
        return;
      }
      setTypingUsers((prev) => ({
        ...prev,
        [payload.userId]: payload.typing ? Date.now() : 0,
      }));
    });

    const unsubHidden = onChatHidden((payload) => {
      if (!uid || payload.userId !== uid) return;
      void loadConversations();
      if (
        payload.conversationId ===
          (activeIdRef.current && uid
            ? chatConversationIdFor(uid, activeIdRef.current)
            : null) &&
        payload.messageIds?.length
      ) {
        const ids = new Set(payload.messageIds);
        setMessages((prev) => prev.filter((m) => !ids.has(m.id)));
      }
    });

    return () => {
      unsubMessage();
      unsubDelivered();
      unsubRead();
      unsubTyping();
      unsubHidden();
    };
  }, [uid, loadConversations]);

  /* Bersihkan indikator typing yang sudah kedaluwarsa. */
  useEffect(() => {
    const timer = window.setInterval(() => {
      setTypingUsers((prev) => {
        const next: Record<string, number> = {};
        let changed = false;
        for (const [k, v] of Object.entries(prev)) {
          if (isRecentTyping(v)) {
            next[k] = v;
          } else if (v !== 0) {
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  /* ===================== Presence ===================== */

  const presenceWatchKey = useMemo(() => {
    const ids = new Set<string>();
    for (const c of conversations) ids.add(c.userId);
    for (const u of users) ids.add(u.uid);
    return Array.from(ids).join(",");
  }, [conversations, users]);

  const presence = usePresence(uid, presenceWatchKey);

  /* ===================== Pencarian pesan ===================== */

  useEffect(() => {
    if (!uid) return;
    if (searchMode !== "messages" || !search.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        const results = await searchMessages(uid, search);
        setSearchResults(results);
      } catch {
        // abaikan kesalahan pencarian
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [uid, search, searchMode]);

  /* ===================== Scroll bawah otomatis ===================== */

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, activeId, mobileView]);

  /* ===================== Aksi percakapan ===================== */

  const openConversation = useCallback(
    async (otherId: string) => {
      if (!uid || otherId === uid) return;
      setActiveId(otherId);
      setMobileView("chat");
      setLoadingMsgs(true);
      setError(null);
      setReplyTo(null);
      setEmojiOpen(false);
      try {
        const list = await getMessages(uid, otherId);
        setMessages(list);
        await loadConversations();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat pesan");
      } finally {
        setLoadingMsgs(false);
      }
    },
    [uid, loadConversations]
  );

  const handleDeleteConversation = useCallback(
    async (conversationId: string, peerId: string) => {
      if (!uid) return;
      try {
        await hideConversationForMe(uid, conversationId);
        if (activeIdRef.current === peerId) {
          setActiveId(null);
          setMobileView("list");
          setMessages([]);
        }
        await loadConversations();
        toast.success("Percakapan disembunyikan untuk Anda");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Gagal menyembunyikan percakapan"
        );
      }
    },
    [uid, loadConversations]
  );

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      if (!uid) return;
      try {
        await hideMessageForMe(uid, messageId);
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        toast.success("Pesan dihapus untuk Anda");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Gagal menghapus pesan"
        );
      }
    },
    [uid]
  );

  /* ===================== Kirim pesan ===================== */

  const emitTypingThrottled = useCallback(() => {
    if (!uid || !activeId || !activeConvoId) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < TYPING_EMIT_INTERVAL_MS) return;
    lastTypingSentRef.current = now;
    notifyTyping(activeConvoId, uid, true);
  }, [uid, activeId, activeConvoId]);

  const handleSend = useCallback(async () => {
    if (!uid || !activeId || sending) return;
    const text = draft.trim();
    const attachment = pendingAttachment;
    if (!text && !attachment) return;

    const tempId = `opt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const temp: ChatMessage = {
      id: tempId,
      conversationId: activeConvoId ?? "",
      senderId: uid,
      receiverId: activeId,
      message: text,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "sending",
      readAt: null,
      deliveredAt: null,
      replyToId: replyTo?.id ?? null,
      deletedFor: [],
      attachment,
    };

    setSending(true);
    setDraft("");
    setReplyTo(null);
    setPendingAttachment(null);
    if (activeConvoId) notifyTyping(activeConvoId, uid, false);
    setMessages((prev) => [...prev, temp]);

    try {
      const sent = await sendMessage({
        senderId: uid,
        receiverId: activeId,
        text,
        replyToId: temp.replyToId,
        attachment,
      });
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempId);
        if (withoutTemp.some((m) => m.id === sent.id)) return withoutTemp;
        return [...withoutTemp, sent];
      });
      await loadConversations();
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error(err instanceof Error ? err.message : "Gagal mengirim pesan");
    } finally {
      setSending(false);
    }
  }, [
    uid,
    activeId,
    activeConvoId,
    draft,
    sending,
    pendingAttachment,
    replyTo,
    loadConversations,
  ]);

  /* ===================== Emoji ===================== */

  const insertEmoji = useCallback((emoji: string) => {
    setDraft((prev) => `${prev}${emoji}`);
  }, []);

  /* ===================== Turunan tampilan ===================== */

  const activeUser = useMemo(() => {
    if (!activeId) return null;
    return (
      users.find((u) => u.uid === activeId) ??
      conversations.find((c) => c.userId === activeId) ??
      null
    );
  }, [activeId, users, conversations]);

  const otherPresence = useMemo(() => {
    if (!activeId) return null;
    return presence[activeId];
  }, [activeId, presence]);

  const peerTypingActive = useMemo(() => {
    if (!activeId) return false;
    return isRecentTyping(typingUsers[activeId] ?? 0);
  }, [typingUsers, activeId]);

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (searchMode !== "chats" || !q) return conversations;
    return conversations.filter((c) => c.name.toLowerCase().includes(q));
  }, [conversations, search, searchMode]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (searchMode !== "users" || !q) return [];
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, search, searchMode]);

  const filteredPickerUsers = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, pickerQuery]);

  if (!uid) return null;

  return (
    <div className="bg-card flex h-[calc(100dvh-7rem)] min-h-[26rem] flex-col overflow-hidden rounded-xl border shadow-sm lg:h-[calc(100dvh-9.5rem)]">
      <div className="flex min-h-0 flex-1">
        {/* ===================== Panel kiri: daftar ===================== */}
        <aside
          className={cn(
            "flex-col border-r border-border md:flex md:w-80 md:shrink-0",
            mobileView === "chat" ? "hidden md:flex" : "flex w-full md:w-80"
          )}
        >
          <div className="border-b border-border p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <MessageCircle className="size-4 text-primary" />
                Pesan
              </h2>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => {
                  setPickerQuery("");
                  setPickerOpen(true);
                }}
              >
                <MessageSquarePlus className="size-3.5" />
                Chat baru
              </Button>
            </div>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari…"
                className="pl-8"
              />
            </div>
            {search.trim() && (
              <div className="mt-2 flex rounded-lg bg-muted p-0.5">
                {(
                  [
                    ["chats", "Percakapan"],
                    ["users", "Pengguna"],
                    ["messages", "Pesan"],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSearchMode(mode)}
                    className={cn(
                      "flex-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                      searchMode === mode
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="space-y-2 p-3">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg p-2"
                  >
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-3 w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : searchMode === "users" && search.trim() ? (
              filteredUsers.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                  Tidak ada pengguna yang cocok.
                </div>
              ) : (
                <ul className="space-y-0.5 p-2">
                  {filteredUsers.map((u) => (
                    <li key={u.uid}>
                      <button
                        type="button"
                        onClick={() => void openConversation(u.uid)}
                        className="hover:bg-muted/70 flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors"
                      >
                        <div className="relative shrink-0">
                          <Avatar className="size-10">
                            {u.photoUrl && (
                              <AvatarImage src={u.photoUrl} alt={u.name} />
                            )}
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {getInitials(u.name)}
                            </AvatarFallback>
                          </Avatar>
                          {presence[u.uid]?.online && (
                            <span className="bg-green-500 absolute right-0 bottom-0 size-2.5 rounded-full ring-2 ring-card" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{u.name}</p>
                          <p className="text-muted-foreground truncate text-xs">
                            {ROLE_LABELS[u.role]}
                            {u.className ? ` · ${u.className}` : ""}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )
            ) : searchMode === "messages" && search.trim() ? (
              searchResults.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                  Tidak ada isi pesan yang cocok.
                </div>
              ) : (
                <ul className="space-y-0.5 p-2">
                  {searchResults.map((r) => (
                    <li key={r.messageId}>
                      <button
                        type="button"
                        onClick={() => void openConversation(r.peerId)}
                        className="hover:bg-muted/70 w-full rounded-lg px-2 py-2 text-left transition-colors"
                      >
                        <p className="text-xs font-medium">
                          {r.peerName}
                          <span className="text-muted-foreground ml-2 font-normal">
                            {relativeTime(r.createdAt)}
                          </span>
                        </p>
                        <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                          {highlightParts(r.message, search).map((part, i) => (
                            <span
                              key={i}
                              className={cn(
                                part.toLowerCase() ===
                                  search.trim().toLowerCase() &&
                                  "bg-amber-200 text-foreground rounded-sm"
                              )}
                            >
                              {part}
                            </span>
                          ))}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )
            ) : filteredConversations.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-10 text-center">
                <div className="bg-muted flex size-12 items-center justify-center rounded-full">
                  <MessageCircle className="text-muted-foreground size-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Belum ada percakapan</p>
                  <p className="text-muted-foreground mx-auto max-w-[16rem] text-xs">
                    Mulai chat dengan memilih pengguna lain lewat tombol
                    &quot;Chat baru&quot;.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPickerQuery("");
                    setPickerOpen(true);
                  }}
                >
                  Cari pengguna
                </Button>
              </div>
            ) : (
              <ul className="space-y-0.5 p-2">
                {filteredConversations.map((conv) => {
                  const convPresence = presence[conv.userId];
                  return (
                    <li key={conv.userId} className="group relative">
                      <button
                        type="button"
                        onClick={() => void openConversation(conv.userId)}
                        className={cn(
                          "hover:bg-muted/70 flex w-full items-center gap-3 rounded-lg pr-10 py-2.5 text-left transition-colors",
                          activeId === conv.userId && "bg-muted"
                        )}
                      >
                        <div className="relative shrink-0">
                          <Avatar className="size-10">
                            {conv.photoUrl && (
                              <AvatarImage
                                src={conv.photoUrl}
                                alt={conv.name}
                              />
                            )}
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {getInitials(conv.name)}
                            </AvatarFallback>
                          </Avatar>
                          {convPresence?.online && (
                            <span className="bg-green-500 absolute right-0 bottom-0 size-2.5 rounded-full ring-2 ring-card" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-medium">
                              {conv.name}
                            </p>
                            <span className="text-muted-foreground shrink-0 text-[11px]">
                              {relativeTime(conv.lastMessageAt)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-muted-foreground truncate text-xs">
                              {conv.lastMessageFromMe
                                ? `Anda: ${conv.lastMessage}`
                                : conv.lastMessage}
                            </p>
                            {conv.unreadCount > 0 && (
                              <Badge className="bg-primary shrink-0 px-1.5 py-0 text-[10px] text-primary-foreground">
                                {conv.unreadCount > 9
                                  ? "9+"
                                  : conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label={`Menu percakapan ${conv.name}`}
                            className="text-muted-foreground hover:bg-muted absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                          >
                            <MoreVertical className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() =>
                              void handleDeleteConversation(
                                conv.conversationId,
                                conv.userId
                              )
                            }
                          >
                            <Trash2 className="size-4" />
                            Hapus percakapan
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* ===================== Panel kanan: chat ===================== */}
        <section
          className={cn(
            "flex-1 flex-col md:flex",
            mobileView === "list" ? "hidden md:flex" : "flex"
          )}
        >
          {!activeId ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <div className="bg-muted flex size-16 items-center justify-center rounded-2xl">
                <MessageCircle className="text-muted-foreground size-8" />
              </div>
              <div className="mt-4 space-y-1">
                <p className="font-medium">Pilih percakapan</p>
                <p className="text-muted-foreground max-w-sm text-sm">
                  Pilih salah satu percakapan di samping, atau buka chat baru
                  untuk mulai mengobrol.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Header percakapan */}
              <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-3 sm:px-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setMobileView("list")}
                  aria-label="Kembali ke daftar chat"
                >
                  <ArrowLeft className="size-5" />
                </Button>
                <Avatar className="size-8">
                  {activeUser?.photoUrl && (
                    <AvatarImage
                      src={activeUser.photoUrl}
                      alt={activeUser.name}
                    />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {getInitials(activeUser?.name ?? "User")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-sm font-semibold">
                    {activeUser?.name ?? "Pengguna"}
                  </p>
                  {peerTypingActive ? (
                    <p className="text-primary truncate text-xs font-medium">
                      mengetik…
                    </p>
                  ) : otherPresence?.online ? (
                    <p className="text-green-600 truncate text-xs font-medium">
                      online
                    </p>
                  ) : otherPresence && otherPresence.at > 0 ? (
                    <p className="text-muted-foreground truncate text-xs">
                      terakhir dilihat {relativeTime(new Date(otherPresence.at))}
                    </p>
                  ) : (
                    <p className="text-muted-foreground truncate text-xs">
                      {activeUser
                        ? `${ROLE_LABELS[activeUser.role]}${activeUser.className ? ` · ${activeUser.className}` : ""}`
                        : "-"}
                    </p>
                  )}
                </div>
              </header>

              {/* Area pesan */}
              <div
                ref={scrollRef}
                className="bg-muted/40 min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4 sm:px-4"
              >
                {loadingMsgs ? (
                  <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex",
                          i % 2 === 0 ? "justify-end" : "justify-start"
                        )}
                      >
                        <Skeleton className="h-9 w-2/5 rounded-2xl" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 && !peerTypingActive ? (
                  <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                    <UserRound className="text-muted-foreground mx-auto mb-2 size-8" />
                    <p className="text-sm font-medium">Belum ada pesan</p>
                    <p className="text-muted-foreground mt-1 max-w-xs text-xs">
                      Kirim sapaan pertama untuk memulai percakapan. Riwayat
                      chat akan tersimpan otomatis.
                    </p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const mine = msg.senderId === uid;
                    const prev = messages[index - 1];
                    const sameGroup =
                      prev &&
                      prev.senderId === msg.senderId &&
                      new Date(msg.createdAt).getTime() -
                        new Date(prev.createdAt).getTime() <
                        5 * 60_000;
                    const showDaySeparator =
                      !prev || !isSameDay(msg.createdAt, prev.createdAt);
                    const reply = msg.replyToId
                      ? messages.find((m) => m.id === msg.replyToId) ?? null
                      : null;
                    return (
                      <div key={msg.id} className="space-y-1">
                        {showDaySeparator && (
                          <div className="flex justify-center py-1">
                            <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-[10px] font-medium">
                              {daySeparator(msg.createdAt)}
                            </span>
                          </div>
                        )}
                        <div
                          className={cn(
                            "group relative flex",
                            mine ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap sm:max-w-[70%]",
                              mine
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-card text-card-foreground rounded-bl-md shadow-sm",
                              sameGroup && "rounded-t-md"
                            )}
                          >
                            {reply && (
                              <div
                                className={cn(
                                  "mb-1.5 rounded-md border-l-4 px-2 py-1 text-xs",
                                  mine
                                    ? "border-primary-foreground/50 bg-primary-foreground/10"
                                    : "border-primary bg-muted"
                                )}
                              >
                                <p className="font-semibold">
                                  {reply.senderId === uid ? "Anda" : activeUser?.name ?? "Pengguna"}
                                </p>
                                <p className="line-clamp-1 break-all">
                                  {reply.attachment && !reply.message
                                    ? `📎 ${reply.attachment.name}`
                                    : reply.message}
                                </p>
                              </div>
                            )}
                            {msg.attachment && (
                              <div
                                className={cn(
                                  "mb-1.5 flex items-center gap-2 rounded-lg px-2.5 py-2",
                                  mine ? "bg-primary-foreground/10" : "bg-muted"
                                )}
                              >
                                <FileText className="size-4 shrink-0" />
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-medium">
                                    {msg.attachment.name}
                                  </p>
                                  <p className="text-[10px] opacity-70">
                                    {formatAttachmentSize(
                                      msg.attachment?.sizeKb
                                    )}
                                    {msg.attachment?.mime
                                      ? ` · ${msg.attachment.mime}`
                                      : ""}
                                  </p>
                                </div>
                              </div>
                            )}
                            {msg.message && <p>{msg.message}</p>}
                            <div
                              className={cn(
                                "mt-1 flex items-center gap-1 text-[10px]",
                                mine
                                  ? "text-primary-foreground/70 justify-end"
                                  : "text-muted-foreground justify-end"
                              )}
                            >
                              <span>{timeLabel(msg.createdAt)}</span>
                              {mine && <MessageStatusIcon msg={msg} />}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                aria-label="Opsi pesan"
                                className="text-muted-foreground hover:bg-muted absolute top-0 -right-1.5 flex size-6 translate-x-full items-center justify-center rounded-full bg-transparent opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                              >
                                <MoreVertical className="size-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={() => {
                                  setReplyTo(msg);
                                }}
                              >
                                Balas
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() =>
                                  void handleDeleteMessage(msg.id)
                                }
                              >
                                <Trash2 className="size-4" />
                                Hapus untuk saya
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })
                )}
                {peerTypingActive && (
                  <div className="flex justify-start">
                    <div className="bg-card text-card-foreground flex max-w-[80%] rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm">
                      <span className="text-muted-foreground text-xs italic">
                        mengetik…
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input pesan */}
              <div className="shrink-0 border-t border-border p-3">
                {error && (
                  <p className="text-destructive mb-2 text-xs">{error}</p>
                )}

                {replyTo && (
                  <div className="mb-2 flex items-center gap-2 rounded-lg border-l-4 border-primary bg-muted px-3 py-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-primary text-xs font-semibold">
                        Membalas {replyTo.senderId === uid ? "Anda" : activeUser?.name}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {replyTo.attachment && !replyTo.message
                          ? `📎 ${replyTo.attachment.name}`
                          : replyTo.message}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      onClick={() => setReplyTo(null)}
                      aria-label="Batalkan balasan"
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                )}

                <div className="relative">
                  {emojiOpen && (
                    <div className="bg-card absolute bottom-full left-0 z-10 mb-2 w-60 rounded-xl border p-2 shadow-lg">
                      <div className="mb-1.5 flex items-center justify-between px-1">
                        <p className="text-xs font-medium">Emoji</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          onClick={() => setEmojiOpen(false)}
                          aria-label="Tutup emoji"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                      <div className="grid max-h-44 grid-cols-8 gap-0.5 overflow-y-auto">
                        {EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => insertEmoji(emoji)}
                            className="hover:bg-muted flex size-7 items-center justify-center rounded-md text-lg transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const mime = file.type || "";
                          const kind = mime.startsWith("image/")
                            ? "image"
                            : mime
                              ? "document"
                              : "file";
                          setPendingAttachment({
                            name: file.name,
                            sizeKb: Math.max(1, Math.round(file.size / 1024)),
                            type: kind,
                            mime,
                          });
                        }
                        e.target.value = "";
                      }}
                    />
                    {pendingAttachment ? (
                      <div className="bg-muted flex h-10 max-w-[9rem] items-center gap-1.5 rounded-md px-2">
                        <FileText className="text-muted-foreground size-4 shrink-0" />
                        <span className="truncate text-xs">
                          {pendingAttachment.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPendingAttachment(null)}
                          className="text-muted-foreground hover:text-foreground shrink-0"
                          aria-label="Buang lampiran"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Lampirkan file"
                        title="Lampirkan file"
                      >
                        <Paperclip className="size-4.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("shrink-0", emojiOpen && "bg-muted")}
                      onClick={() => setEmojiOpen((v) => !v)}
                      aria-label="Pilih emoji"
                      title="Pilih emoji"
                    >
                      <Smile className="size-4.5" />
                    </Button>
                    <Textarea
                      value={draft}
                      onChange={(e) => {
                        setDraft(e.target.value);
                        if (e.target.value.trim()) emitTypingThrottled();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void handleSend();
                        }
                      }}
                      placeholder="Tulis pesan…"
                      rows={1}
                      className="max-h-32 min-h-10 resize-none"
                      aria-label="Tulis pesan"
                    />
                    <Button
                      size="icon"
                      className="shrink-0"
                      onClick={() => void handleSend()}
                      disabled={(!draft.trim() && !pendingAttachment) || sending}
                      aria-label="Kirim pesan"
                    >
                      {sending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* ===================== Dialog pilih user ===================== */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mulai percakapan baru</DialogTitle>
            <DialogDescription>
              Cari pengguna lain untuk diajak chat.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={pickerQuery}
              onChange={(e) => setPickerQuery(e.target.value)}
              placeholder="Cari nama atau email…"
              className="pl-8"
              autoFocus
            />
          </div>
          <div className="max-h-72 overflow-y-auto">
            {filteredPickerUsers.length === 0 ? (
              <div className="py-8 text-center">
                <UserRound className="text-muted-foreground mx-auto mb-2 size-6" />
                <p className="text-muted-foreground text-sm">
                  Tidak ada pengguna lain yang cocok.
                </p>
              </div>
            ) : (
              <ul className="space-y-0.5">
                {filteredPickerUsers.map((u) => (
                  <li key={u.uid}>
                    <button
                      type="button"
                      onClick={() => {
                        setPickerOpen(false);
                        void openConversation(u.uid);
                      }}
                      className="hover:bg-muted/70 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors"
                    >
                      <div className="relative shrink-0">
                        <Avatar className="size-9">
                          {u.photoUrl && (
                            <AvatarImage src={u.photoUrl} alt={u.name} />
                          )}
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {getInitials(u.name)}
                          </AvatarFallback>
                        </Avatar>
                        {presence[u.uid]?.online && (
                          <span className="bg-green-500 absolute right-0 bottom-0 size-2.5 rounded-full ring-2 ring-card" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{u.name}</p>
                        <p className="text-muted-foreground truncate text-xs">
                          {ROLE_LABELS[u.role]}
                          {u.className ? ` · ${u.className}` : ""}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ===================== Sub-komponen ===================== */

function formatAttachmentSize(sizeKb?: number): string {
  if (!sizeKb) return "-";
  if (sizeKb < 1024) return `${sizeKb} KB`;
  return `${(sizeKb / 1024).toFixed(1)} MB`;
}

function MessageStatusIcon({ msg }: { msg: ChatMessage }) {
  if (msg.status === "sending") {
    return (
      <span className="inline-flex items-center gap-0.5" title="Mengirim…">
        <Clock className="size-3" />
      </span>
    );
  }
  if (msg.status === "read") {
    return (
      <span className="inline-flex items-center gap-0.5" title="Sudah dibaca">
        <CheckCheck className="size-3" />
      </span>
    );
  }
  if (msg.status === "delivered") {
    return (
      <span
        className="inline-flex items-center gap-0.5 opacity-80"
        title="Terkirim & sampai"
      >
        <CheckCheck className="size-3" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5" title="Terkirim">
      <Check className="size-3" />
    </span>
  );
}