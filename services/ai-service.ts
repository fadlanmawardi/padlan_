import {
  dbUsers,
  dbBooks,
  dbCategories,
  dbLoans,
  dbFines,
  dbAssignments,
  dbSubmissions,
  dbAttendanceSessions,
  dbAttendanceRecords,
  dbSubjects,
  dbScheduleEntries,
  dbAcademicEvents,
  dbExamSchedules,
  dbGrades,
  dbQuizzes,
  dbQuizAttempts,
  dbMaterials,
  dbForumThreads,
  dbForumPosts,
  dbAnnouncements,
  dbWishlist,
  dbStudyTargets,
  dbStudyNotes,
  dbBookRatings,
  dbActivities,
} from "./store";
import {
  computeStudentMetrics,
  evaluateAchievements,
  getStreak,
  ACHIEVEMENT_DEFS,
} from "./gamification-service";
import {
  DAY_NAMES,
  DAY_NAMES_SHORT,
  gradePredicate,
  isPassed,
  jsDayToIndex,
  todayKey,
} from "@/lib/academics";
import { formatDate, daysUntil } from "@/lib/format";
import type { AppUser, Role } from "@/types";

function subjectName(subjectId: string): string {
  return dbSubjects.find((s) => s.id === subjectId)?.name ?? subjectId;
}

function categoryName(categoryId: string): string {
  return dbCategories.find((c) => c.id === categoryId)?.name ?? "Umum";
}

function bookTitle(bookId: string): string {
  return dbBooks.find((b) => b.id === bookId)?.title ?? bookId;
}

function teacherName(teacherId: string): string {
  return dbUsers.find((u) => u.uid === teacherId)?.name ?? "Guru";
}

function getUser(uid: string): AppUser | undefined {
  return dbUsers.find((u) => u.uid === uid);
}

export function getTodayIndex(): number {
  return jsDayToIndex(new Date().getDay());
}

/* =============================================================
   SISWA
   ============================================================= */

export interface AiStudentTask {
  id: string;
  title: string;
  subject: string;
  deadline: string;
  dueInDays: number;
  taskState: string;
  closed: boolean;
  score?: number;
}

export interface AiStudentGrade {
  subject: string;
  average: number;
  predicate: string;
  count: number;
  best: number;
}

export interface AiStudentSnapshot {
  student: AppUser;
  className: string;
  tasks: AiStudentTask[];
  deadlineTasks: AiStudentTask[];
  scheduleToday: { subject: string; start: string; end: string; room: string }[];
  scheduleTomorrow: { subject: string; start: string; end: string; room: string }[];
  grades: AiStudentGrade[];
  overallAverage: number;
  overallPredicate: string;
  attendance: {
    totalSessions: number;
    present: number;
    permission: number;
    sick: number;
    absent: number;
    percentage: number;
  };
  todayAttendance: string | null;
  activeLoans: { title: string; dueAt: string; daysLeft: number; status: string }[];
  loanHistoryCount: number;
  unpaidFines: number;
  wishlistCount: number;
  targets: { title: string; progress: number; goal: number; unit: string; done: boolean }[];
  notesCount: number;
  metrics: ReturnType<typeof computeStudentMetrics>;
  unlocked: { id: string; title: string; xp: number }[];
  lockedCount: number;
  rank: { rank: number; total: number };
  leaderboardTop: { name: string; className: string; xp: number }[];
  streak: { current: number; longest: number };
  examsUpcoming: { title: string; subject: string; date: string; start: string; room: string }[];
  eventsUpcoming: { title: string; date: string }[];
  announcements: { title: string; priority: string; date: string }[];
  materialsForClass: { title: string; subject: string }[];
  quizzesForClass: { title: string; subject: string; questionCount: number }[];
}

export function getStudentAiData(uid: string): AiStudentSnapshot {
  const student = getUser(uid) ?? ({} as AppUser);
  const className = student.className ?? "XI IPA 1";

  const assignmentsForClass = dbAssignments.filter(
    (a) => a.className === className
  );

  const tasks: AiStudentTask[] = assignmentsForClass
    .map((a) => {
      const submission = dbSubmissions.find(
        (s) => s.assignmentId === a.id && s.studentId === uid
      );
      let taskState = "belum dikerjakan";
      if (submission?.status === "submitted") {
        taskState =
          submission.submittedAt && submission.submittedAt <= a.deadline
            ? "dikumpulkan"
            : "terlambat";
      } else if (submission?.status === "draft") {
        taskState = "draft";
      } else if (a.deadline < new Date().toISOString()) {
        taskState = "terlambat";
      }
      const closed =
        a.deadline < new Date().toISOString() || taskState === "dikumpulkan";
      return {
        id: a.id,
        title: a.title,
        subject: a.subject,
        deadline: a.deadline,
        dueInDays: daysUntil(a.deadline),
        taskState,
        closed,
        score: submission?.grade,
      };
    })
    .sort((x, y) => x.dueInDays - y.dueInDays);

  const deadlineTasks = tasks
    .filter((t) => !t.closed && t.dueInDays <= 7)
    .slice(0, 5);

  const todayIndex = getTodayIndex();
  const tomorrowIndex = (todayIndex + 1) % 7;

  const scheduleFor = (day: number) =>
    dbScheduleEntries
      .filter((e) => e.className === className && e.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map((e) => ({
        subject: subjectName(e.subjectId),
        start: e.startTime,
        end: e.endTime,
        room: e.room,
      }));

  const myGrades = dbGrades.filter((g) => g.studentId === uid);
  const subjectIds = Array.from(new Set(myGrades.map((g) => g.subjectId)));
  const grades: AiStudentGrade[] = subjectIds
    .map((subjectId) => {
      const scores = myGrades.filter((g) => g.subjectId === subjectId).map((g) => g.score);
      const average = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      return {
        subject: subjectName(subjectId),
        average,
        predicate: gradePredicate(average),
        count: scores.length,
        best: Math.max(...scores),
      };
    })
    .sort((a, b) => b.average - a.average);

  const overallAverage =
    myGrades.length > 0
      ? Math.round(myGrades.reduce((sum, g) => sum + g.score, 0) / myGrades.length)
      : 0;

  const sessions = dbAttendanceSessions.filter((s) =>
    dbUsers.some(
      (u) => u.uid === uid && u.role === "student" && u.className === s.className
    )
  );
  const myRecords = dbAttendanceRecords.filter((r) => r.studentId === uid);
  const present = myRecords.filter((r) => r.status === "present").length;
  const permission = myRecords.filter((r) => r.status === "permission").length;
  const sick = myRecords.filter((r) => r.status === "sick").length;
  const absent = myRecords.filter((r) => r.status === "absent").length;
  const totalSessions = sessions.length;
  const percentage =
    totalSessions > 0 ? Math.round((present / totalSessions) * 100) : 0;

  let todayAttendance: string | null = null;
  const todaySession = sessions.find((s) => s.date.slice(0, 10) === todayKey());
  if (todaySession) {
    const rec = myRecords.find((r) => r.sessionId === todaySession.id);
    todayAttendance = rec?.status ?? null;
  }

  const myLoans = dbLoans
    .filter((l) => l.studentId === uid)
    .sort((a, b) => b.borrowedAt.localeCompare(a.borrowedAt));
  const activeLoans = myLoans
    .filter((l) => l.status === "borrowed" || l.status === "overdue")
    .map((l) => ({
      title: bookTitle(l.bookId),
      dueAt: l.dueAt,
      daysLeft: daysUntil(l.dueAt),
      status: l.status === "overdue" ? "terlambat" : "dipinjam",
    }));
  const unpaidFines = dbFines.filter(
    (f) => f.studentId === uid && f.status === "unpaid"
  ).length;

  const wishlistCount = dbWishlist.filter((w) => w.userId === uid).length;
  const targets = dbStudyTargets
    .filter((t) => t.studentId === uid)
    .map((t) => ({
      title: t.title,
      progress: t.progress,
      goal: t.goal,
      unit: t.unit,
      done: t.done,
    }));
  const notesCount = dbStudyNotes.filter(
    (n) => n.studentId === uid
  ).length;

  const metrics = computeStudentMetrics(uid);
  const unlocked = evaluateAchievements(metrics).map((a) => ({
    id: a.id,
    title: a.title,
    xp: a.xp,
  }));
  const lockedCount = ACHIEVEMENT_DEFS.length - unlocked.length;
  const streak = getStreak(uid);

  const ranked = dbUsers
    .filter((u) => u.role === "student" && u.status === "active")
    .map((u) => ({ uid: u.uid, xp: computeStudentMetrics(u.uid).xp }))
    .sort((a, b) => b.xp - a.xp);
  const rankIndex = ranked.findIndex((r) => r.uid === uid);
  const leaderboardTop = ranked
    .slice(0, 5)
    .map((r) => {
      const u = getUser(r.uid);
      return {
        name: u?.name ?? "Siswa",
        className: u?.className ?? "",
        xp: r.xp,
      };
    });

  const upcomingExams = dbExamSchedules
    .filter((e) => e.className === className && e.date >= todayKey())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)
    .map((e) => ({
      title: e.title,
      subject: subjectName(e.subjectId),
      date: e.date,
      start: e.startTime,
      room: e.room,
    }));

  const upcomingEvents = dbAcademicEvents
    .filter(
      (e) =>
        e.date >= todayKey() &&
        (e.className === className || !e.className)
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)
    .map((e) => ({ title: e.title, date: e.date }));

  const announcements = dbAnnouncements
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4)
    .map((a) => ({
      title: a.title,
      priority: a.priority,
      date: a.createdAt,
    }));

  const materialsForClass = dbMaterials
    .slice(0, 6)
    .map((m) => ({ title: m.title, subject: subjectName(m.subjectId) }));

  const quizzesForClass = dbQuizzes
    .filter((q) => q.className === className)
    .slice(0, 4)
    .map((q) => ({
      title: q.title,
      subject: subjectName(q.subjectId),
      questionCount: q.questions.length,
    }));

  return {
    student,
    className,
    tasks,
    deadlineTasks,
    scheduleToday: scheduleFor(todayIndex),
    scheduleTomorrow: scheduleFor(tomorrowIndex),
    grades,
    overallAverage,
    overallPredicate: gradePredicate(overallAverage),
    attendance: { totalSessions, present, permission, sick, absent, percentage },
    todayAttendance,
    activeLoans,
    loanHistoryCount: myLoans.length,
    unpaidFines,
    wishlistCount,
    targets,
    notesCount,
    metrics,
    unlocked,
    lockedCount,
    rank: { rank: rankIndex >= 0 ? rankIndex + 1 : ranked.length + 1, total: ranked.length },
    leaderboardTop,
    streak: { current: streak.currentStreak, longest: streak.longestStreak },
    examsUpcoming: upcomingExams,
    eventsUpcoming: upcomingEvents,
    announcements,
    materialsForClass,
    quizzesForClass,
  };
}

/* =============================================================
   ADMIN & SUPERADMIN
   ============================================================= */

export interface AiAdminSnapshot {
  roleName: string;
  totalStudents: number;
  totalTeachers: number;
  totalBooks: number;
  totalCategories: number;
  totalAssignments: number;
  totalLoans: number;
  activeLoans: number;
  overdueLoans: number;
  unpaidFines: number;
  totalSubmissions: number;
  notSubmitted: number;
  todayPresent: number;
  todayTotal: number;
  todayAttendanceRate: number;
  upcomingDeadlineCount: number;
  upcomingExamCount: number;
  announcementCount: number;
  recentAnnouncements: { title: string; priority: string }[];
  popularBooks: { title: string; loans: number }[];
  classes: number;
  pendingPosts: number;
  quizCount: number;
  events: { title: string; date: string }[];
  activeUsers: number;
  activities: { message: string; time: string }[];
}

export function getAdminAiData(role: Role): AiAdminSnapshot {
  const students = dbUsers.filter((u) => u.role === "student" && u.status === "active");
  const teachers = dbUsers.filter((u) => u.role === "admin");
  const classes = Array.from(new Set(students.map((s) => s.className).filter(Boolean)));

  const activeLoans = dbLoans.filter((l) => l.status === "borrowed");
  const overdueLoans = dbLoans.filter((l) => l.status === "overdue");
  const unpaidFines = dbFines.filter((f) => f.status === "unpaid");
  const totalSubmissions = dbSubmissions.filter((s) => s.status === "submitted").length;
  const allAssignments = dbAssignments.length;

  const today = todayKey();
  const todaySessions = dbAttendanceSessions.filter((s) => s.date.slice(0, 10) === today);
  const todayRecords = dbAttendanceRecords.filter((r) =>
    todaySessions.some((s) => s.id === r.sessionId)
  );
  const todayPresent = todayRecords.filter((r) => r.status === "present").length;
  const todayTotal = todayRecords.length;

  const upcomingDeadlineCount = dbAssignments.filter(
    (a) => a.deadline >= today && daysUntil(a.deadline) <= 7
  ).length;
  const upcomingExamCount = dbExamSchedules.filter(
    (e) => e.date >= today
  ).length;

  const announcements = dbAnnouncements.sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  const loanCountByBook = new Map<string, number>();
  for (const loan of dbLoans) {
    loanCountByBook.set(loan.bookId, (loanCountByBook.get(loan.bookId) ?? 0) + 1);
  }
  const popularBooks = Array.from(loanCountByBook.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([bookId, count]) => ({ title: bookTitle(bookId), loans: count }));

  const recentActivities = dbActivities
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 5)
    .map((a) => ({ message: a.message, time: a.timestamp }));

  const upcomingEvents = dbAcademicEvents
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)
    .map((e) => ({ title: e.title, date: e.date }));

  return {
    roleName: role === "superadmin" ? "Super Admin" : "Admin",
    totalStudents: students.length,
    totalTeachers: teachers.length,
    totalBooks: dbBooks.length,
    totalCategories: dbCategories.length,
    totalAssignments: allAssignments,
    totalLoans: dbLoans.length,
    activeLoans: activeLoans.length,
    overdueLoans: overdueLoans.length,
    unpaidFines: unpaidFines.length,
    totalSubmissions,
    notSubmitted: allAssignments > 0 ? Math.max(0, allAssignments - totalSubmissions) : 0,
    todayPresent,
    todayTotal,
    todayAttendanceRate: todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : 0,
    upcomingDeadlineCount,
    upcomingExamCount,
    announcementCount: announcements.length,
    recentAnnouncements: announcements.slice(0, 3).map((a) => ({ title: a.title, priority: a.priority })),
    popularBooks,
    classes: classes.length,
    pendingPosts: dbForumPosts.length,
    quizCount: dbQuizzes.length,
    events: upcomingEvents,
    activeUsers: dbUsers.filter((u) => u.status === "active").length,
    activities: recentActivities,
  };
}

/* =============================================================
   PENCARIAN DATA
   ============================================================= */

export interface AiSearchResults {
  books: { title: string; author: string; category: string; available: number }[];
  students: { name: string; className: string; nis?: string }[];
  teachers: { name: string; email: string }[];
  subjects: { name: string; teacher: string }[];
  assignments: { title: string; className: string; deadline: string }[];
  announcements: { title: string; priority: string }[];
  materials: { title: string; subject: string }[];
  quizzes: { title: string; className: string }[];
  events: { title: string; date: string }[];
  forums: { title: string; author: string }[];
}

export function searchAiData(query: string): AiSearchResults {
  const q = query.toLowerCase().trim();
  const empty = {
    books: [],
    students: [],
    teachers: [],
    subjects: [],
    assignments: [],
    announcements: [],
    materials: [],
    quizzes: [],
    events: [],
    forums: [],
  };
  if (!q || q.length < 2) return empty;

  const STOPWORDS = new Set([
    "cari",
    "search",
    "data",
    "guru",
    "buku",
    "siswa",
    "tentang",
    "mata",
    "pelajaran",
    "informasi",
    "apa",
    "yang",
    "dari",
    "untuk",
    "dan",
    "dengan",
    "info",
    "semua",
  ]);
  const tokens = q
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));

  const match = (...fields: (string | undefined)[]) => {
    if (tokens.length === 0) {
      return fields.some((f) => !!f && f.toLowerCase().includes(q));
    }
    return fields.some((f) => {
      if (!f) return false;
      const fl = f.toLowerCase();
      return tokens.some((t) => fl.includes(t));
    });
  };

  const bookCategory = (categoryId: string) =>
    dbCategories.find((c) => c.id === categoryId)?.name ?? "";

  return {
    books: dbBooks
      .filter((b) =>
        match(b.title, b.author, b.isbn, b.publisher, bookCategory(b.categoryId))
      )
      .slice(0, 5)
      .map((b) => ({
        title: b.title,
        author: b.author,
        category: categoryName(b.categoryId),
        available: b.availableCopies,
      })),
    students: dbUsers
      .filter(
        (u) =>
          u.role === "student" &&
          match(u.name, u.className ?? "", u.nis)
      )
      .slice(0, 5)
      .map((u) => ({ name: u.name, className: u.className ?? "", nis: u.nis })),
    teachers: dbUsers
      .filter((u) => u.role === "admin" && match(u.name, u.email))
      .slice(0, 5)
      .map((u) => ({ name: u.name, email: u.email })),
    subjects: dbSubjects
      .filter((s) => match(s.name, s.code, s.description))
      .slice(0, 5)
      .map((s) => ({ name: s.name, teacher: teacherName(s.teacherId) })),
    assignments: dbAssignments
      .filter((a) => match(a.title, a.className, a.subject))
      .slice(0, 5)
      .map((a) => ({ title: a.title, className: a.className, deadline: formatDate(a.deadline) })),
    announcements: dbAnnouncements
      .filter((a) => match(a.title, a.content))
      .slice(0, 5)
      .map((a) => ({ title: a.title, priority: a.priority })),
    materials: dbMaterials
      .filter((m) => match(m.title, m.description ?? "", subjectName(m.subjectId)))
      .slice(0, 5)
      .map((m) => ({ title: m.title, subject: subjectName(m.subjectId) })),
    quizzes: dbQuizzes
      .filter((q2) => match(q2.title, q2.className, subjectName(q2.subjectId)))
      .slice(0, 5)
      .map((q2) => ({ title: q2.title, className: q2.className })),
    events: dbAcademicEvents
      .filter((e) => match(e.title, e.description ?? ""))
      .slice(0, 5)
      .map((e) => ({ title: e.title, date: formatDate(e.date) })),
    forums: dbForumThreads
      .filter((t) => match(t.title))
      .slice(0, 5)
      .map((t) => ({ title: t.title, author: t.authorName })),
  };
}

/* =============================================================
   UTIL PUBLIK UNTUK ENGINE
   ============================================================= */

export function subjectCount(): number {
  return dbSubjects.length;
}

export interface AiBookSummary {
  total: number;
  categories: number;
  popular: { title: string; author: string; available: number; loans: number }[];
}

export function getBookSummary(): AiBookSummary {
  const loanCountByBook = new Map<string, number>();
  for (const loan of dbLoans) {
    loanCountByBook.set(loan.bookId, (loanCountByBook.get(loan.bookId) ?? 0) + 1);
  }
  const popular = Array.from(loanCountByBook.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([bookId, loans]) => {
      const book = dbBooks.find((b) => b.id === bookId);
      return {
        title: book?.title ?? bookId,
        author: book?.author ?? "",
        available: book?.availableCopies ?? 0,
        loans,
      };
    })
    .filter((b) => b.title);
  return { total: dbBooks.length, categories: dbCategories.length, popular };
}

export function quizAttemptCount(uid: string): number {
  return dbQuizAttempts.filter((a) => a.studentId === uid).length;
}

export function bookRating(bookId: string): string {
  const ratings = dbBookRatings.filter((r) => r.bookId === bookId);
  if (ratings.length === 0) return "belum ada rating";
  const avg = ratings.reduce((a, r) => a + r.rating, 0) / ratings.length;
  return avg.toFixed(1);
}

export { DAY_NAMES, DAY_NAMES_SHORT, gradePredicate, isPassed, formatDate };
