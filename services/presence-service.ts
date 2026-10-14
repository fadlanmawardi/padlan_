import { onPresenceChanged, presenceChanged } from "./realtime-service";

/**
 * Presence (online/offline) ringan untuk mode demo.
 *
 * Implementasi berbasis "heartbeat" per-tab yang disimpan di localStorage:
 *  - Setiap tab menandai dirinya online untuk user yang sedang login.
 *  - Tab lain membaca gabungan semua tab → user dianggap online jika masih
 *    ada tab yang berdenyut dalam rentang waktu aman (MAX_ONLINE_MS).
 *  - Tidak ada data yang disimpan permanen; cukup untuk indikator UI.
 */

const PRESENCE_KEY = "schoolhub-presence-v1";
const MAX_ONLINE_MS = 90_000;

export interface PresenceEntry {
  uid: string;
  online: boolean;
  at: number;
}

export interface PresenceInfo {
  online: boolean;
  /** Timestamp aktivitas terakhir (untuk label "terakhir dilihat"). */
  at: number;
}

let tabId: string | null = null;

function myTabId(): string {
  if (!tabId) {
    tabId = `tab-${Math.random().toString(36).slice(2)}`;
  }
  return tabId;
}

function readRaw(): Record<string, PresenceEntry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PRESENCE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, PresenceEntry>;
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed;
  } catch {
    return {};
  }
}

function write(map: Record<string, PresenceEntry>): void {
  if (typeof window === "undefined") return;
  try {
    // Jaga agar map tetap kecil dengan membuang entri basi.
    const now = Date.now();
    const pruned: Record<string, PresenceEntry> = {};
    for (const [key, entry] of Object.entries(map)) {
      if (entry && now - entry.at < MAX_ONLINE_MS * 2) {
        pruned[key] = entry;
      }
    }
    window.localStorage.setItem(PRESENCE_KEY, JSON.stringify(pruned));
  } catch {
    // abaikan
  }
}

/** Tandai tab ini online (heartbeat) untuk `uid`. */
export function touchPresence(uid: string): void {
  const map = readRaw();
  map[myTabId()] = { uid, online: true, at: Date.now() };
  write(map);
  presenceChanged(uid, true);
}

/** Tandai tab ini offline (dipanggil saat tab ditutup / komponen unmount). */
export function setPresenceOffline(uid: string): void {
  const map = readRaw();
  if (map[myTabId()]?.uid === uid) {
    map[myTabId()] = { uid, online: false, at: Date.now() };
    write(map);
    presenceChanged(uid, false);
  }
}

/** Status presence untuk satu uid. */
export function getPresence(uid: string): PresenceInfo {
  const now = Date.now();
  const entries = Object.values(readRaw())
    .filter((e) => e.uid === uid)
    .sort((a, b) => b.at - a.at);
  const latest = entries[0];
  if (!latest) return { online: false, at: 0 };
  const online = latest.online && now - latest.at < MAX_ONLINE_MS;
  return { online, at: online ? latest.at : latest.at };
}

/** Status presence untuk banyak uid sekaligus. */
export function getPresenceMany(uids: string[]): Record<string, PresenceInfo> {
  const result: Record<string, PresenceInfo> = {};
  for (const uid of uids) {
    result[uid] = getPresence(uid);
  }
  return result;
}

export { onPresenceChanged };