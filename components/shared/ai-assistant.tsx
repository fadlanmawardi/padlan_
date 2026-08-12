"use client";

import * as React from "react";
import {
  Bot,
  Check,
  ChevronDown,
  Copy,
  History,
  Maximize2,
  Minimize2,
  Moon,
  Plus,
  Send,
  Sparkles,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Markdown } from "@/lib/ai/markdown";
import {
  generateReply,
  createMemory,
  SUGGESTIONS_BY_ROLE,
  type AiMemory,
} from "@/lib/ai/engine";
import type { Role } from "@/types";

/* =============================================================
   TIPE DATA
   ============================================================= */

interface ChatMessage {
  id: string;
  role: "bot" | "user";
  content: string;
  createdAt: number;
}

interface ChatHistoryItem {
  id: string;
  preview: string;
  messageCount: number;
  updatedAt: number;
  messages: ChatMessage[];
}

const CHAT_KEY = (uid: string) => `sh-ai-chat-v1-${uid}`;
const MEMORY_KEY = (uid: string) => `sh-ai-memory-v1-${uid}`;
const HISTORY_KEY = (uid: string) => `sh-ai-history-v1-${uid}`;
const SIZE_KEY = "sh-ai-size-v1";

const MIN_W = 340;
const MIN_H = 420;

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function nowTimestamp(): number {
  return Date.now();
}

function timeLabel(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // abaikan
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/* =============================================================
   BUBBLE BOT DENGAN STREAMING
   ============================================================= */

function BotMessage({
  message,
  active,
  onDone,
  onTick,
}: {
  message: ChatMessage;
  active: boolean;
  onDone: () => void;
  onTick: () => void;
}) {
  const [shown, setShown] = React.useState(
    active ? "" : message.content
  );

  React.useEffect(() => {
    if (!active) {
      setShown(message.content);
      return;
    }
    setShown("");
    let index = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = () => {
      index += 2 + Math.floor(Math.random() * 3);
      const next = message.content.slice(0, index);
      setShown(next);
      onTick();
      if (index >= message.content.length) {
        setShown(message.content);
        onDone();
        return;
      }
      timer = setTimeout(tick, 14 + Math.random() * 18);
    };
    timer = setTimeout(tick, 130);

    return () => {
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, message.content]);

  const [copied, setCopied] = React.useState(false);

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // abaikan
    }
  }

  return (
    <div className="flex items-end gap-2">
      <div className="bg-gradient-to-br from-primary to-primary/70 flex size-7 shrink-0 items-center justify-center rounded-full text-primary-foreground shadow-sm">
        <Sparkles className="size-3.5" />
      </div>
      <div className="bg-card group max-w-[85%] rounded-2xl rounded-bl-sm border px-3.5 py-2.5 shadow-sm">
        <Markdown content={active ? shown : message.content} />
        {active && (
          <span className="text-primary ml-0.5 inline-block animate-pulse">▍</span>
        )}
        <div className="text-muted-foreground mt-1.5 flex items-center gap-2 text-[10px]">
          <span>SchoolHub Assistant • {timeLabel(message.createdAt)}</span>
          <button
            type="button"
            onClick={() => void copyMessage()}
            className="text-muted-foreground/70 hover:text-foreground flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Salin pesan"
          >
            {copied ? (
              <Check className="size-3 text-emerald-500" />
            ) : (
              <Copy className="size-3" />
            )}
            <span>{copied ? "Tersalin" : "Salin"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function UserMessage({ message }: { message: ChatMessage }) {
  const [copied, setCopied] = React.useState(false);

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // abaikan
    }
  }

  return (
    <div className="flex items-end justify-end gap-2">
      <div className="group max-w-[85%]">
        <div className="from-primary to-primary/80 bg-gradient-to-br rounded-2xl rounded-br-sm px-3.5 py-2.5 text-sm leading-snug text-white shadow-sm">
          <Markdown content={message.content} />
        </div>
        <div className="text-muted-foreground flex items-center justify-end gap-2 pt-1 text-[10px]">
          <span>Kamu • {timeLabel(message.createdAt)}</span>
          <button
            type="button"
            onClick={() => void copyMessage()}
            className="text-muted-foreground/70 hover:text-foreground flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Salin pesan"
          >
            {copied ? (
              <Check className="size-3 text-emerald-500" />
            ) : (
              <Copy className="size-3" />
            )}
          </button>
        </div>
      </div>
      <div className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold">
        {message.content
          ? message.content.slice(0, 1).toUpperCase()
          : "?"}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="bg-gradient-to-br from-primary to-primary/70 flex size-7 shrink-0 items-center justify-center rounded-full text-primary-foreground shadow-sm">
        <Sparkles className="size-3.5" />
      </div>
      <div className="bg-card flex items-center gap-1.5 rounded-2xl rounded-bl-sm border px-3.5 py-3 shadow-sm">
        <span className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full" />
        <span className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full [animation-delay:120ms]" />
        <span className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full [animation-delay:240ms]" />
      </div>
    </div>
  );
}

/* =============================================================
   KOMPONEN UTAMA
   ============================================================= */

export function AiAssistant() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const [open, setOpen] = React.useState(false);
  const [maximized, setMaximized] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [typing, setTyping] = React.useState(false);
  const [streamingId, setStreamingId] = React.useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [history, setHistory] = React.useState<ChatHistoryItem[]>([]);
  const [size, setSize] = React.useState({ w: 380, h: 560 });

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const memoryRef = React.useRef<AiMemory>(createMemory());

  const role = (user?.role ?? "student") as Role;
  const uidUser = user?.uid ?? "guest";

  /* ---------- ukuran (persist) ---------- */
  React.useEffect(() => {
    const stored = readJson<{ w: number; h: number }>(SIZE_KEY);
    if (stored?.w && stored?.h) {
      setSize({ w: clamp(stored.w, MIN_W, 720), h: clamp(stored.h, MIN_H, 760) });
    }
  }, []);

  React.useEffect(() => {
    if (open) writeJson(SIZE_KEY, size);
  }, [open, size]);

  /* ---------- load chat dari localStorage ---------- */
  React.useEffect(() => {
    if (!user?.uid) return;
    const savedMessages = readJson<ChatMessage[]>(CHAT_KEY(user.uid));
    const savedMemory = readJson<AiMemory>(MEMORY_KEY(user.uid));
    const savedHistory = readJson<ChatHistoryItem[]>(HISTORY_KEY(user.uid));

    if (savedMemory) memoryRef.current = savedMemory;
    if (savedHistory) setHistory(savedHistory);
    if (savedMessages) {
      setMessages(savedMessages);
    }
  }, [user?.uid]);

  /* ---------- persist chat ---------- */
  React.useEffect(() => {
    if (!user?.uid) return;
    writeJson(CHAT_KEY(user.uid), messages);
  }, [user?.uid, messages]);

  React.useEffect(() => {
    if (!user?.uid) return;
    writeJson(MEMORY_KEY(user.uid), memoryRef.current);
    writeJson(HISTORY_KEY(user.uid), history);
  }, [user?.uid, history]);

  /* ---------- auto scroll ---------- */
  const scrollDown = React.useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight });
    });
  }, []);

  React.useEffect(() => {
    scrollDown();
  }, [messages, typing, streamingId, open, scrollDown]);

  React.useEffect(() => {
    if (open) setHistoryOpen(false);
  }, [open]);

  /* ---------- aksi ---------- */

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || typing || streamingId) return;

    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "user", content: trimmed, createdAt: nowTimestamp() },
    ]);
    setInput("");
    setTyping(true);
    scrollDown();

    await new Promise((resolve) => setTimeout(resolve, 420 + Math.random() * 380));

    const result = await generateReply({
      input: trimmed,
      user: user ?? { uid: uidUser, email: null, name: "Siswa", role },
      memory: memoryRef.current,
    });
    memoryRef.current = result.memory;

    const botId = uid();
    setTyping(false);
    setMessages((prev) => [
      ...prev,
      { id: botId, role: "bot", content: result.answer, createdAt: nowTimestamp() },
    ]);
    setStreamingId(botId);
    scrollDown();
  }

  function newChat() {
    if (messages.length > 0) {
      const preview =
        messages.find((m) => m.role === "user")?.content.slice(0, 48) ??
        "Percakapan baru";
      const item: ChatHistoryItem = {
        id: uid(),
        preview,
        messageCount: messages.length,
        updatedAt: nowTimestamp(),
        messages,
      };
      setHistory((prev) => [item, ...prev].slice(0, 10));
    }
    memoryRef.current = createMemory();
    setMessages([]);
    setStreamingId(null);
    setHistoryOpen(false);
    setOpen(true);
  }

  function restoreHistory(item: ChatHistoryItem) {
    if (messages.length > 0) {
      const preview =
        messages.find((m) => m.role === "user")?.content.slice(0, 48) ??
        "Percakapan baru";
      const current: ChatHistoryItem = {
        id: uid(),
        preview,
        messageCount: messages.length,
        updatedAt: nowTimestamp(),
        messages,
      };
      setHistory((prev) => [current, ...prev.filter((h) => h.id !== item.id)].slice(0, 10));
    } else {
      setHistory((prev) => prev.filter((h) => h.id !== item.id));
    }
    setMessages(item.messages);
    setStreamingId(null);
    setHistoryOpen(false);
  }

  function clearChat() {
    if (
      messages.length > 0 &&
      !window.confirm("Hapus semua pesan dalam percakapan ini?")
    ) {
      return;
    }
    memoryRef.current = createMemory();
    setMessages([]);
    setStreamingId(null);
  }

  const suggestions = SUGGESTIONS_BY_ROLE[role];

  /* ---------- pointer resize ---------- */

  function handleResizeStart(e: React.PointerEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = size.w;
    const startH = size.h;
    const maxW = Math.min(760, window.innerWidth - 32);
    const maxH = Math.min(760, window.innerHeight - 140);

    const move = (ev: PointerEvent) => {
      setSize({
        w: clamp(startW + ev.clientX - startX, MIN_W, maxW),
        h: clamp(startH + ev.clientY - startY, MIN_H, maxH),
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  const windowStyle: React.CSSProperties = maximized
    ? { width: "min(92vw, 760px)", height: "min(88vh, 720px)" }
    : { width: size.w, height: size.h };

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end sm:right-6 sm:bottom-6">
      {/* ===== WINDOW CHAT ===== */}
      {open && (
        <div
          style={windowStyle}
          className={cn(
            "bg-background mb-3 flex flex-col overflow-hidden rounded-2xl border shadow-2xl transition-[width,height] duration-150",
            "max-w-[calc(100vw-2rem)]"
          )}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary via-primary/90 to-violet-500/80 text-primary-foreground relative shrink-0">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
                <Bot className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  SchoolHub Assistant
                  <span className="bg-emerald-400/90 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-950">
                    Online
                  </span>
                </p>
                <p className="text-primary-foreground/80 text-[11px]">
                  Asisten pintar • {role === "student" ? "Siswa" : role === "admin" ? "Admin" : "Super Admin"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground rounded-lg p-1.5 transition-colors"
                aria-label="Ganti tema"
                title={theme === "dark" ? "Mode terang" : "Mode gelap"}
              >
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setHistoryOpen((value) => !value)}
                  className="text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground rounded-lg p-1.5 transition-colors"
                  aria-label="Riwayat percakapan"
                  title="Riwayat percakapan"
                >
                  <History className="size-4" />
                </button>
                {historyOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setHistoryOpen(false)}
                    />
                    <div className="bg-popover text-popover-foreground absolute right-0 top-9 z-20 max-h-72 w-64 overflow-y-auto rounded-xl border p-1.5 shadow-lg">
                      <p className="text-muted-foreground px-2 py-1.5 text-[11px] font-medium">
                        Riwayat Percakapan
                      </p>
                      {history.length === 0 && (
                        <p className="text-muted-foreground px-2 py-3 text-center text-[11px]">
                          Belum ada percakapan tersimpan.
                        </p>
                      )}
                      {history.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => restoreHistory(item)}
                          className="hover:bg-muted w-full rounded-lg px-2 py-2 text-left"
                        >
                          <p className="line-clamp-1 text-xs font-medium">
                            {item.preview}
                          </p>
                          <p className="text-muted-foreground text-[10px]">
                            {item.messageCount} pesan •{" "}
                            {new Date(item.updatedAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => newChat()}
                className="text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground rounded-lg p-1.5 transition-colors"
                aria-label="Percakapan baru"
                title="Percakapan baru"
              >
                <Plus className="size-4" />
              </button>

              <button
                type="button"
                onClick={() => setMaximized((value) => !value)}
                className="text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground rounded-lg p-1.5 transition-colors"
                aria-label={maximized ? "Perkecil jendela" : "Perbesar jendela"}
                title={maximized ? "Perkecil" : "Perbesar"}
              >
                {maximized ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground rounded-lg p-1.5 transition-colors"
                aria-label="Tutup asisten"
                title="Tutup"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-3"
          >
            {messages.length === 0 && !typing ? (
              <EmptyState
                name={user?.name?.split(" ")[0] ?? "teman"}
                suggestions={suggestions}
                onPick={(s) => void send(s)}
              />
            ) : (
              <>
                {messages.map((message) =>
                  message.role === "bot" ? (
                    <BotMessage
                      key={message.id}
                      message={message}
                      active={message.id === streamingId}
                      onDone={() => setStreamingId(null)}
                      onTick={scrollDown}
                    />
                  ) : (
                    <UserMessage key={message.id} message={message} />
                  )
                )}
                {typing && <TypingIndicator />}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t bg-card/50 p-3">
            {messages.length > 0 && (
              <div className="mb-2 flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.slice(0, 2).map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void send(suggestion)}
                      className="bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-full px-2.5 py-1 text-[11px] transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => clearChat()}
                  className="text-muted-foreground hover:text-destructive flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] transition-colors"
                  title="Hapus percakapan"
                >
                  <Trash2 className="size-3" />
                  Hapus
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
              className="flex items-end gap-2"
            >
              <div className="bg-muted/70 focus-within:border-primary focus-within:ring-primary/20 flex-1 rounded-xl border px-3 transition-colors focus-within:ring-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send(input);
                    }
                  }}
                  onInput={(e) => {
                    const el = e.currentTarget;
                    el.style.height = "auto";
                    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                  }}
                  rows={1}
                  placeholder="Tanyakan sesuatu…"
                  className="max-h-[120px] w-full resize-none bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground/60"
                />
              </div>
              <Button
                type="submit"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-xl"
                disabled={!input.trim() || typing || !!streamingId}
                aria-label="Kirim pesan"
              >
                <Send className="size-4" />
              </Button>
            </form>
            <p className="text-muted-foreground mt-1.5 flex items-center gap-1 text-[10px]">
              <ChevronDown className="size-3" />
              Enter untuk mengirim, Shift+Enter untuk baris baru
            </p>
          </div>

          {/* Handle resize */}
          {!maximized && (
            <div
              onPointerDown={handleResizeStart}
              className="hover:bg-primary/20 group absolute right-0 bottom-0 z-10 h-5 w-5 cursor-nwse-resize rounded-bl-lg"
              title="Seret untuk mengubah ukuran"
            >
              <div className="absolute right-1 bottom-1 size-2 rounded-sm border-r-2 border-b-2 border-muted-foreground/50 group-hover:border-primary" />
            </div>
          )}
        </div>
      )}

      {/* ===== TOMBOL MENGAMBANG ===== */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "from-primary to-violet-500 bg-gradient-to-br relative flex items-center justify-center rounded-full text-white shadow-xl transition-all duration-200",
          open ? "rotate-90" : "hover:scale-105"
        )}
        style={{ width: 56, height: 56 }}
        aria-label={open ? "Tutup asisten" : "Buka asisten"}
      >
        {open ? <X className="size-6" /> : <Bot className="size-7" />}
        {!open && messages.length > 0 && (
          <span className="bg-destructive absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background text-[10px] font-bold">
            {messages.length}
          </span>
        )}
      </button>
    </div>
  );
}

/* =============================================================
   EMPTY STATE
   ============================================================= */

function EmptyState({
  name,
  suggestions,
  onPick,
}: {
  name: string;
  suggestions: string[];
  onPick: (suggestion: string) => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-2 py-4 text-center">
      <div className="from-primary to-violet-500 bg-gradient-to-br mb-3 flex size-16 items-center justify-center rounded-3xl text-white shadow-lg">
        <Bot className="size-8" />
      </div>
      <p className="text-sm font-semibold">Halo, {name}! 👋</p>
      <p className="text-muted-foreground mt-1 max-w-[260px] text-xs leading-relaxed">
        Aku <strong>SchoolHub Assistant</strong>. Tanyakan apa saja tentang
        tugas, jadwal, nilai, buku, atau fitur SchoolHub lainnya.
      </p>
      <div className="mt-4 grid w-full max-w-[300px] grid-cols-1 gap-1.5">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onPick(suggestion)}
            className="bg-card text-foreground hover:border-primary hover:text-primary group flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs shadow-sm transition-colors"
          >
            <span className="from-primary to-violet-500 bg-gradient-to-br flex size-5 shrink-0 items-center justify-center rounded-md text-white">
              <Sparkles className="size-3" />
            </span>
            <span className="flex-1">{suggestion}</span>
            <ChevronDown className="text-muted-foreground size-3 -rotate-90 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ))}
      </div>
    </div>
  );
}
