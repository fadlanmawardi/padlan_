import type {
  Activity,
  AcademicEvent,
  Announcement,
  AppUser,
  AppNotification,
  Assignment,
  AttendanceRecord,
  AttendanceSession,
  AuditEntry,
  BankQuestion,
  Book,
  BookRating,
  BookWishlistItem,
  Category,
  ChatConversation,
  ChatMessage,
  ExamSchedule,
  Fine,
  ForumPost,
  ForumThread,
  Grade,
  Loan,
  LoginHistoryEntry,
  Material,
  Quiz,
  QuizAttempt,
  Rubric,
  ScheduleEntry,
  StudyNote,
  StudyTarget,
  Subject,
  Submission,
  TaskBookmark,
  UserAchievement,
} from "@/types";
import {
  mockActivities,
  mockAssignments,
  mockAttendanceRecords,
  mockAttendanceSessions,
  mockBooks,
  mockCategories,
  mockFines,
  mockLoans,
  mockSubmissions,
  mockUsers,
} from "@/data/mock";
import {
  mockAcademicEvents,
  mockAnnouncements,
  mockAuditEntries,
  mockBankQuestions,
  mockBookRatings,
  mockBookmarks,
  mockExamSchedules,
  mockForumPosts,
  mockForumThreads,
  mockGrades,
  mockMaterials,
  mockNotifications,
  mockQuizzes,
  mockQuizAttempts,
  mockRubrics,
  mockScheduleEntries,
  mockStudyNotes,
  mockStudyTargets,
  mockSubjects,
  mockWishlist,
} from "@/data/mock-extra";

export const dbUsers: AppUser[] = [...mockUsers];
export const dbBooks: Book[] = [...mockBooks];
export const dbCategories: Category[] = [...mockCategories];
export const dbLoans: Loan[] = [...mockLoans];
export const dbFines: Fine[] = [...mockFines];
export const dbActivities: Activity[] = [...mockActivities];
export const dbAssignments: Assignment[] = [...mockAssignments];
export const dbSubmissions: Submission[] = [...mockSubmissions];
export const dbAttendanceSessions: AttendanceSession[] = [
  ...mockAttendanceSessions,
];
export const dbAttendanceRecords: AttendanceRecord[] = [
  ...mockAttendanceRecords,
];

export const dbSubjects: Subject[] = [...mockSubjects];
export const dbScheduleEntries: ScheduleEntry[] = [...mockScheduleEntries];
export const dbAcademicEvents: AcademicEvent[] = [...mockAcademicEvents];
export const dbExamSchedules: ExamSchedule[] = [...mockExamSchedules];
export const dbGrades: Grade[] = [...mockGrades];
export const dbBankQuestions: BankQuestion[] = [...mockBankQuestions];
export const dbQuizzes: Quiz[] = [...mockQuizzes];
export const dbQuizAttempts: QuizAttempt[] = [...mockQuizAttempts];
export const dbRubrics: Rubric[] = [...mockRubrics];
export const dbMaterials: Material[] = [...mockMaterials];
export const dbForumThreads: ForumThread[] = [...mockForumThreads];
export const dbForumPosts: ForumPost[] = [...mockForumPosts];
export const dbAnnouncements: Announcement[] = [...mockAnnouncements];
export const dbNotifications: AppNotification[] = [...mockNotifications];
export const dbBookRatings: BookRating[] = [...mockBookRatings];
export const dbWishlist: BookWishlistItem[] = [...mockWishlist];
export const dbBookmarks: TaskBookmark[] = [...mockBookmarks];
export const dbStudyNotes: StudyNote[] = [...mockStudyNotes];
export const dbStudyTargets: StudyTarget[] = [...mockStudyTargets];
export const dbUserAchievements: UserAchievement[] = [];
export const dbAuditEntries: AuditEntry[] = [...mockAuditEntries];

/* ===================== Chat antar User (database demo) ===================== */

export interface ChatDbData {
  conversations: ChatConversation[];
  messages: ChatMessage[];
}

const CHAT_DB_KEY = "schoolhub-chat-db-v2";
const CHAT_LEGACY_KEY = "schoolhub-chat-messages-v1";

/**
 * "Database" chat untuk mode demo. Data dibuat persisten lewat localStorage
 * sehingga riwayat chat TIDAK hilang saat halaman di-refresh, user logout
 * lalu login kembali, maupun saat aplikasi di-restart (data tinggal di
 * browser). Di server (SSR) nilai awal kosong; diisi lewat layanan setelah
 * mount di sisi klien.
 */
export const dbChatData: ChatDbData = {
  conversations: [],
  messages: [],
};

function isChatConversation(value: unknown): value is ChatConversation {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  const deletedOk =
    v.deletedFor === undefined ||
    (Array.isArray(v.deletedFor) &&
      v.deletedFor.every((d) => typeof d === "string"));
  return (
    typeof v.id === "string" &&
    Array.isArray(v.participants) &&
    v.participants.length === 2 &&
    v.participants.every((p) => typeof p === "string") &&
    typeof v.lastMessage === "string" &&
    typeof v.lastMessageAt === "string" &&
    typeof v.lastSenderId === "string" &&
    typeof v.createdAt === "string" &&
    typeof v.updatedAt === "string" &&
    deletedOk
  );
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.conversationId === "string" &&
    typeof v.senderId === "string" &&
    typeof v.receiverId === "string" &&
    typeof v.message === "string" &&
    typeof v.createdAt === "string" &&
    typeof v.updatedAt === "string" &&
    (typeof v.readAt === "string" || v.readAt === null) &&
    (typeof v.deliveredAt === "string" || v.deliveredAt === null)
  );
}

function isChatDbData(value: unknown): value is ChatDbData {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.conversations) &&
    Array.isArray(v.messages) &&
    v.conversations.every(isChatConversation) &&
    v.messages.every(isChatMessage)
  );
}

/**
 * Id percakapan diturunkan secara deterministik dari pasangan uid.
 * Karena urutan di-sort, percakapan A<->B selalu memakai id yang sama
 * dan tidak akan pernah dibuat dua kali.
 */
export function chatConversationIdFor(userA: string, userB: string): string {
  return `cv-${[userA, userB].sort().join("-")}`;
}

function isLegacyChatMessage(value: unknown): value is {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  createdAt: string;
  readAt: string | null;
  status: string;
} {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.senderId === "string" &&
    typeof v.receiverId === "string" &&
    typeof v.message === "string" &&
    typeof v.createdAt === "string"
  );
}

/**
 * Migrasi data chat versi 1 (mungkin masih ada di browser dari versi
 * sebelumnya) menjadi format v2 agar chat lama tetap tersedia.
 */
function migrateLegacyChat(raw: unknown): ChatDbData | null {
  if (!Array.isArray(raw)) return null;
  const legacy = raw.filter(isLegacyChatMessage);
  if (legacy.length === 0) return null;

  const grouped = new Map<string, ChatMessage[]>();
  for (const m of legacy) {
    if (m.senderId === m.receiverId) continue;
    const conversationId = chatConversationIdFor(m.senderId, m.receiverId);
    const list = grouped.get(conversationId) ?? [];
    const wasRead = m.status === "read" || m.readAt !== null;
    list.push({
      id: m.id,
      conversationId,
      senderId: m.senderId,
      receiverId: m.receiverId,
      message: m.message,
      createdAt: m.createdAt,
      updatedAt: m.createdAt,
      status: wasRead ? "read" : "sent",
      readAt: m.readAt ?? null,
      deliveredAt: wasRead ? m.readAt ?? m.createdAt : null,
      deletedFor: [],
      replyToId: null,
      attachment: null,
    });
    grouped.set(conversationId, list);
  }

  const conversations: ChatConversation[] = [];
  for (const [conversationId, msgs] of grouped) {
    const sorted = [...msgs].sort(
      (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
    );
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    conversations.push({
      id: conversationId,
      participants: chatParticipantsFromId(first.senderId, first.receiverId),
      lastMessage: last.message,
      lastMessageAt: last.createdAt,
      lastSenderId: last.senderId,
      createdAt: first.createdAt,
      updatedAt: last.createdAt,
      deletedFor: [],
    });
  }

  return { conversations, messages: Array.from(grouped.values()).flat() };
}

function chatParticipantsFromId(
  senderId: string,
  receiverId: string
): string[] {
  return [senderId, receiverId].sort();
}

function hydrateChat(data: ChatDbData): void {
  dbChatData.conversations.length = 0;
  dbChatData.messages.length = 0;
  dbChatData.conversations.push(...data.conversations);
  dbChatData.messages.push(...data.messages);
}

/**
 * Muat database chat dari localStorage ke memori. Memprioritaskan format v2;
 * jika hanya tersedia v1, data lama dimigrasikan otomatis.
 */
export function syncChatDbFromStorage(): ChatDbData {
  if (typeof window === "undefined") return dbChatData;
  try {
    const v2 = window.localStorage.getItem(CHAT_DB_KEY);
    if (v2) {
      const parsed = JSON.parse(v2) as unknown;
      if (isChatDbData(parsed)) {
        hydrateChat(parsed);
        return dbChatData;
      }
    }
    const legacy = window.localStorage.getItem(CHAT_LEGACY_KEY);
    if (legacy) {
      const migrated = migrateLegacyChat(JSON.parse(legacy));
      if (migrated) {
        hydrateChat(migrated);
        persistChatDb();
        return dbChatData;
      }
    }
  } catch {
    // abaikan jika data korup / localStorage tidak tersedia
  }
  return dbChatData;
}

/** Simpan database chat saat ini ke localStorage (durable). */
export function persistChatDb(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHAT_DB_KEY, JSON.stringify(dbChatData));
  } catch {
    // abaikan ketika penyimpanan penuh / tidak tersedia
  }
}

/* ===================== Akun & Keamanan (demo) ===================== */

export const dbPasswords = new Map<string, string>(
  mockUsers.map((u) => [u.uid, "demo1234"])
);

export const dbResetTokens = new Map<string, string>();

export const dbEmailVerified = new Set<string>(
  mockUsers.filter((u) => u.emailVerified).map((u) => u.uid)
);

export const dbLoginHistory: LoginHistoryEntry[] = [
  {
    id: "lh-1",
    userId: "u-super",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    browser: "Chrome 126",
    device: "Windows 11 · Desktop",
    status: "success",
  },
  {
    id: "lh-2",
    userId: "u-super",
    timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    browser: "Chrome 125",
    device: "Android · Mobile",
    status: "success",
  },
  {
    id: "lh-3",
    userId: "u-a1",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    browser: "Edge 126",
    device: "Windows 11 · Desktop",
    status: "success",
  },
  {
    id: "lh-4",
    userId: "u-s01",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    browser: "Safari 17",
    device: "iPhone · Mobile",
    status: "success",
  },
  {
    id: "lh-5",
    userId: "u-super",
    timestamp: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(),
    browser: "Firefox 127",
    device: "macOS · Desktop",
    status: "failed",
  },
];

export const dbSessionTimeoutMinutes = 30;

/**
 * Menyelaraskan status stok buku dengan data peminjaman aktif.
 * Menjadikan pinjaman sebagai satu-satunya sumber kebenaran untuk
 * availableCopies/status buku agar data antar role selalu konsisten.
 */
export function reconcileBookAvailability(): void {
  const activeByBook = new Map<string, number>();
  for (const loan of dbLoans) {
    if (loan.status === "borrowed" || loan.status === "overdue") {
      activeByBook.set(loan.bookId, (activeByBook.get(loan.bookId) ?? 0) + 1);
    }
  }
  for (const book of dbBooks) {
    const borrowed = activeByBook.get(book.id) ?? 0;
    const available = Math.max(0, book.totalCopies - borrowed);
    book.availableCopies = available;
    book.status =
      book.totalCopies <= 0 ? "unavailable" : available > 0 ? "available" : "borrowed";
  }
}

reconcileBookAvailability();

export function nextId(prefix: string, existing: string[]): string {
  const max = Math.max(
    0,
    ...existing
      .filter((id) => id.startsWith(prefix))
      .map((id) => parseInt(id.slice(prefix.length), 10))
      .filter((n) => !Number.isNaN(n))
  );
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

export function delay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function findByUser(uid: string): AppUser | undefined {
  return dbUsers.find((u) => u.uid === uid);
}

export function findByBook(id: string): Book | undefined {
  return dbBooks.find((b) => b.id === id);
}

export function findByCategory(id: string): Category | undefined {
  return dbCategories.find((c) => c.id === id);
}
