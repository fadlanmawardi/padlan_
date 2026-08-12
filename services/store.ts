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
