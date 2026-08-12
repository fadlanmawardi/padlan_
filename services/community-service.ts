import type {
  Announcement,
  AnnouncementPriority,
  AnnouncementRecord,
  AppNotification,
  AuditEntry,
  NotificationType,
} from "@/types";
import {
  dbAnnouncements,
  dbAuditEntries,
  dbNotifications,
  dbUsers,
  delay,
  findByUser,
  nextId,
} from "./store";
import { logActivity } from "./activity-service";
import { notify, dataChanged } from "./realtime-service";

function emitNotificationSync(userId: string): void {
  dataChanged("notification", userId);
}

/* ===================== Pengumuman ===================== */

function toAnnouncementRecord(announcement: Announcement): AnnouncementRecord {
  const author = findByUser(announcement.authorId);
  return {
    ...announcement,
    authorName: author?.name ?? "Pengguna telah dihapus",
  };
}

export async function getAnnouncements(): Promise<AnnouncementRecord[]> {
  await delay();
  return [...dbAnnouncements]
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.createdAt.localeCompare(a.createdAt);
    })
    .map(toAnnouncementRecord);
}

export async function createAnnouncement(input: {
  title: string;
  content: string;
  authorId: string;
  priority: AnnouncementPriority;
  attachment?: string;
  pinned?: boolean;
}): Promise<AnnouncementRecord> {
  await delay();
  const announcement: Announcement = {
    id: nextId("an-", dbAnnouncements.map((a) => a.id)),
    title: input.title,
    content: input.content,
    authorId: input.authorId,
    priority: input.priority,
    attachment: input.attachment,
    pinned: input.pinned ?? false,
    createdAt: new Date().toISOString(),
  };
  dbAnnouncements.push(announcement);
  const author = findByUser(input.authorId);
  await logActivity("system", `membuat pengumuman "${announcement.title}"`, author?.name ?? "Sistem");
  const prefix =
    input.priority === "urgent"
      ? "🚨"
      : input.priority === "important"
        ? "📌"
        : "📢";
  for (const student of dbUsers.filter((u) => u.role === "student")) {
    void pushNotification({
      userId: student.uid,
      type: "announcement",
      title: "Pengumuman baru",
      message: `${prefix} ${announcement.title}`,
      link: `/student/announcements`,
    });
  }
  return toAnnouncementRecord(announcement);
}

export async function updateAnnouncement(
  id: string,
  patch: Partial<Omit<Announcement, "id" | "createdAt">>
): Promise<AnnouncementRecord> {
  await delay();
  const index = dbAnnouncements.findIndex((a) => a.id === id);
  if (index === -1) throw new Error("Pengumuman tidak ditemukan");
  dbAnnouncements[index] = { ...dbAnnouncements[index], ...patch, id };
  return toAnnouncementRecord(dbAnnouncements[index]);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await delay();
  const index = dbAnnouncements.findIndex((a) => a.id === id);
  if (index !== -1) dbAnnouncements.splice(index, 1);
}

export const ANNOUNCEMENT_META: Record<
  AnnouncementPriority,
  { label: string; className: string }
> = {
  normal: { label: "Normal", className: "bg-muted text-muted-foreground" },
  important: { label: "Penting", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  urgent: { label: "Mendesak", className: "bg-red-500/15 text-red-600 dark:text-red-400" },
};

/* ===================== Notifikasi ===================== */

export interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export async function getNotifications(
  userId: string
): Promise<AppNotification[]> {
  await delay();
  return dbNotifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getUnreadCount(userId: string): Promise<number> {
  await delay(100);
  return dbNotifications.filter((n) => n.userId === userId && !n.read).length;
}

export async function markNotificationRead(
  id: string,
  userId: string
): Promise<void> {
  await delay(80);
  const notification = dbNotifications.find(
    (n) => n.id === id && n.userId === userId
  );
  if (notification) notification.read = true;
  emitNotificationSync(userId);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await delay(120);
  for (const notification of dbNotifications) {
    if (notification.userId === userId) notification.read = true;
  }
  emitNotificationSync(userId);
}

export async function pushNotification(input: NotifyInput): Promise<AppNotification> {
  const notification: AppNotification = {
    id: nextId("ntf-", dbNotifications.map((n) => n.id)),
    ...input,
    read: false,
    createdAt: new Date().toISOString(),
  };
  dbNotifications.unshift(notification);
  // Sinkronkan ke notification center / badge / AI melalui layanan realtime.
  notify(input.userId, { ...notification });
  return { ...notification };
}

/* ===================== Preferensi Notifikasi ===================== */

export type NotificationPreferenceKey =
  | NotificationType
  | "achievement"
  | "sound";

const PREFS_KEY = (userId: string) => `sh-notif-prefs-v1-${userId}`;

export type NotificationPreferences = Partial<
  Record<NotificationPreferenceKey, boolean>
>;

export const NOTIFICATION_PREFS_LABELS: Record<NotificationPreferenceKey, string> = {
  assignment: "Tugas",
  deadline: "Deadline",
  grade: "Nilai",
  announcement: "Pengumuman",
  book_due: "Buku",
  quiz: "Quiz",
  material: "Materi",
  system: "Sistem",
  attendance: "Absensi",
  achievement: "Achievement",
  sound: "Suara notifikasi",
};

function readPreferences(userId: string): NotificationPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY(userId));
    if (!raw) return {};
    return JSON.parse(raw) as NotificationPreferences;
  } catch {
    return {};
  }
}

function writePreferences(userId: string, prefs: NotificationPreferences): void {
  try {
    localStorage.setItem(PREFS_KEY(userId), JSON.stringify(prefs));
  } catch {
    // abaikan jika localStorage tidak tersedia
  }
}

export function getNotificationPreferences(
  userId: string
): NotificationPreferences {
  return readPreferences(userId);
}

export function setNotificationPreference(
  userId: string,
  key: NotificationPreferenceKey,
  enabled: boolean
): NotificationPreferences {
  const next = { ...readPreferences(userId), [key]: enabled };
  writePreferences(userId, next);
  return next;
}

/** Apakah kategori notifikasi diizinkan untuk user tertentu. */
export function isNotificationCategoryEnabled(
  userId: string,
  type: NotificationType
): boolean {
  const prefs = readPreferences(userId);
  return prefs[type] !== false;
}

export function isSoundEnabled(userId: string): boolean {
  return readPreferences(userId)["sound"] === true;
}

export function setSoundEnabled(userId: string, enabled: boolean): void {
  writePreferences(userId, { ...readPreferences(userId), sound: enabled });
}

/** Ambil + filter notifikasi berdasarkan preferensi user. */
export async function getNotificationsForUser(
  userId: string
): Promise<AppNotification[]> {
  const prefs = readPreferences(userId);
  return dbNotifications
    .filter((n) => n.userId === userId && prefs[n.type] !== false)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getNotificationsSummary(): Promise<{
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
}> {
  await delay(120);
  const all = dbNotifications;
  const byType = {
    assignment: 0,
    deadline: 0,
    grade: 0,
    announcement: 0,
    book_due: 0,
    quiz: 0,
    material: 0,
    system: 0,
    attendance: 0,
  };
  for (const notification of all) {
    byType[notification.type] += 1;
  }
  return {
    total: all.length,
    unread: all.filter((n) => !n.read).length,
    byType,
  };
}

/* ===================== Audit Log ===================== */

export async function getAuditEntries(limit = 50): Promise<AuditEntry[]> {
  await delay();
  return [...dbAuditEntries]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit)
    .map((e) => ({ ...e }));
}

export async function logAudit(
  actor: string,
  action: string,
  target: string
): Promise<AuditEntry> {
  const entry: AuditEntry = {
    id: nextId("au-", dbAuditEntries.map((e) => e.id)),
    actor,
    action,
    target,
    timestamp: new Date().toISOString(),
  };
  dbAuditEntries.unshift(entry);
  return { ...entry };
}

export async function getUserNames(): Promise<Map<string, string>> {
  await delay(80);
  return new Map(dbUsers.map((u) => [u.uid, u.name]));
}

export const NOTIFICATION_META: Record<
  NotificationType,
  { label: string; className: string }
> = {
  assignment: { label: "Tugas", className: "bg-primary/15 text-primary" },
  deadline: { label: "Deadline", className: "bg-red-500/15 text-red-600 dark:text-red-400" },
  grade: { label: "Nilai", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  announcement: { label: "Pengumuman", className: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
  book_due: { label: "Buku", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  quiz: { label: "Quiz", className: "bg-violet-500/15 text-violet-600 dark:text-violet-400" },
  material: { label: "Materi", className: "bg-teal-500/15 text-teal-600 dark:text-teal-400" },
  system: { label: "Sistem", className: "bg-muted text-muted-foreground" },
  attendance: { label: "Absensi", className: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400" },
};
