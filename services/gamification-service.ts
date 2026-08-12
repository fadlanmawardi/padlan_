import type {
  AchievementDef,
  LeaderboardRow,
  StreakData,
  StudentLearningStats,
  UserAchievement,
} from "@/types";
import {
  dbAssignments,
  dbAttendanceRecords,
  dbAttendanceSessions,
  dbGrades,
  dbLoans,
  dbQuizAttempts,
  dbSubmissions,
  dbUserAchievements,
  dbUsers,
  delay,
  findByUser,
} from "./store";

export const XP_RULES = {
  attendance: 10,
  late: 5,
  submitOnTime: 20,
  loan: 5,
  quiz: 25,
  topGrade: 15,
};

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: "ach-perfect-attendance",
    title: "Perfect Attendance",
    description: "Kehadiran minimal 90% sepanjang periode",
    icon: "CheckCircle2",
    xp: 100,
  },
  {
    id: "ach-never-late",
    title: "Never Late",
    description: "Tidak pernah terlambat masuk kelas",
    icon: "Clock",
    xp: 80,
  },
  {
    id: "ach-thirty-day-streak",
    title: "30 Days Streak",
    description: "Hadir 30 hari sekolah berturut-turut",
    icon: "Flame",
    xp: 150,
  },
  {
    id: "ach-attendance-master",
    title: "Attendance Master",
    description: "Kehadiran minimal 95% sepanjang periode",
    icon: "Trophy",
    xp: 120,
  },
  {
    id: "ach-book-lover",
    title: "Book Lover",
    description: "Meminjam minimal 3 buku",
    icon: "BookMarked",
    xp: 80,
  },
  {
    id: "ach-fast-submitter",
    title: "Fast Submitter",
    description: "Mengumpulkan minimal 3 tugas tepat waktu",
    icon: "Zap",
    xp: 90,
  },
  {
    id: "ach-top-student",
    title: "Top Student",
    description: "Rata-rata nilai minimal 85",
    icon: "Trophy",
    xp: 120,
  },
  {
    id: "ach-early-bird",
    title: "Early Bird",
    description: "Belajar 5 hari berturut-turut",
    icon: "Sunrise",
    xp: 70,
  },
  {
    id: "ach-quiz-master",
    title: "Quiz Master",
    description: "Menyelesaikan minimal 2 quiz",
    icon: "ClipboardCheck",
    xp: 85,
  },
];

export interface StudentMetrics {
  uid: string;
  name: string;
  className?: string;
  attendanceRate: number;
  presentCount: number;
  lateCount: number;
  sessionCount: number;
  onTimeSubmissions: number;
  totalSubmissions: number;
  loanCount: number;
  quizCount: number;
  avgQuizScore: number;
  gradeAverage: number;
  xp: number;
}

function computeStudentMetrics(uid: string): StudentMetrics {
  const student = findByUser(uid);
  const attendanceIds = new Set(
    dbAttendanceRecords
      .filter((r) => r.studentId === uid && r.status === "present")
      .map((r) => r.sessionId)
  );
  const lateIds = new Set(
    dbAttendanceRecords
      .filter((r) => r.studentId === uid && r.status === "late")
      .map((r) => r.sessionId)
  );
  const sessionCount = dbAttendanceSessions.filter((s) => {
    const classStudents = dbUsers.filter(
      (u) => u.role === "student" && u.className === s.className
    );
    return classStudents.some((u) => u.uid === uid);
  }).length;
  const presentCount = attendanceIds.size;
  const lateCount = lateIds.size;
  const attendedCount = presentCount + lateCount;
  const attendanceRate =
    sessionCount > 0 ? Math.round((attendedCount / sessionCount) * 100) : 0;

  let onTimeSubmissions = 0;
  let totalSubmissions = 0;
  for (const submission of dbSubmissions) {
    if (submission.studentId !== uid || submission.status !== "submitted") continue;
    totalSubmissions += 1;
    const assignment = dbAssignments.find((a) => a.id === submission.assignmentId);
    const submittedAt = submission.submittedAt ? new Date(submission.submittedAt).getTime() : 0;
    const deadline = assignment ? new Date(assignment.deadline).getTime() : Date.now();
    if (submittedAt && submittedAt <= deadline) {
      onTimeSubmissions += 1;
    }
  }

  const loanCount = dbLoans.filter((l) => l.studentId === uid).length;

  const attempts = dbQuizAttempts.filter((a) => a.studentId === uid);
  const quizCount = attempts.length;
  const avgQuizScore =
    attempts.length > 0
      ? Math.round(
          attempts.reduce((sum, a) => sum + (a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0), 0) /
            attempts.length
        )
      : 0;

  const grades = dbGrades.filter((g) => g.studentId === uid);
  const gradeAverage =
    grades.length > 0
      ? Math.round(grades.reduce((sum, g) => sum + g.score, 0) / grades.length)
      : 0;

  const xp =
    presentCount * XP_RULES.attendance +
    lateCount * XP_RULES.late +
    onTimeSubmissions * XP_RULES.submitOnTime +
    loanCount * XP_RULES.loan +
    quizCount * XP_RULES.quiz +
    grades.filter((g) => g.score >= 85).length * XP_RULES.topGrade;

  return {
    uid,
    name: student?.name ?? "Siswa",
    className: student?.className,
    attendanceRate,
    presentCount,
    lateCount,
    sessionCount,
    onTimeSubmissions,
    totalSubmissions,
    loanCount,
    quizCount,
    avgQuizScore,
    gradeAverage,
    xp,
  };
}

export function evaluateAchievements(metrics: StudentMetrics): AchievementDef[] {
  const unlocked: AchievementDef[] = [];
  if (metrics.attendanceRate >= 90) {
    unlocked.push(ACHIEVEMENT_DEFS[0]);
  }
  if (metrics.lateCount === 0 && metrics.sessionCount > 0) {
    unlocked.push(ACHIEVEMENT_DEFS[1]);
  }
  if (getStreak(metrics.uid).longestStreak >= 30) {
    unlocked.push(ACHIEVEMENT_DEFS[2]);
  }
  if (metrics.attendanceRate >= 95) {
    unlocked.push(ACHIEVEMENT_DEFS[3]);
  }
  if (metrics.loanCount >= 3) unlocked.push(ACHIEVEMENT_DEFS[4]);
  if (metrics.onTimeSubmissions >= 3) unlocked.push(ACHIEVEMENT_DEFS[5]);
  if (metrics.gradeAverage >= 85) unlocked.push(ACHIEVEMENT_DEFS[6]);
  if (getStreak(metrics.uid).currentStreak >= 5) unlocked.push(ACHIEVEMENT_DEFS[7]);
  if (metrics.quizCount >= 2) unlocked.push(ACHIEVEMENT_DEFS[8]);
  return unlocked;
}

export async function getStudentAchievements(
  studentId: string
): Promise<{ unlocked: AchievementDef[]; locked: AchievementDef[]; xp: number }> {
  await delay(250);
  const metrics = computeStudentMetrics(studentId);
  const unlocked = evaluateAchievements(metrics);
  const locked = ACHIEVEMENT_DEFS.filter(
    (def) => !unlocked.some((u) => u.id === def.id)
  );
  return { unlocked, locked, xp: metrics.xp };
}

export async function getLeaderboard(limit = 10): Promise<LeaderboardRow[]> {
  await delay();
  const rows: LeaderboardRow[] = dbUsers
    .filter((u) => u.role === "student" && u.status === "active")
    .map((u) => {
      const metrics = computeStudentMetrics(u.uid);
      return {
        userId: u.uid,
        name: u.name,
        role: u.role,
        className: u.className,
        xp: metrics.xp,
      };
    })
    .sort((a, b) => b.xp - a.xp);
  return rows.slice(0, limit);
}

export async function getStudentRank(
  studentId: string
): Promise<{ rank: number; total: number; xp: number }> {
  await delay(200);
  const rows = dbUsers
    .filter((u) => u.role === "student" && u.status === "active")
    .map((u) => ({
      uid: u.uid,
      xp: computeStudentMetrics(u.uid).xp,
    }))
    .sort((a, b) => b.xp - a.xp);
  const index = rows.findIndex((r) => r.uid === studentId);
  return {
    rank: index >= 0 ? index + 1 : rows.length + 1,
    total: rows.length,
    xp: computeStudentMetrics(studentId).xp,
  };
}

export function getStreak(studentId: string): StreakData {
  const dates = new Set(
    dbAttendanceRecords
      .filter((r) => r.studentId === studentId && r.status === "present")
      .map((r) => {
        const session = dbAttendanceSessions.find((s) => s.id === r.sessionId);
        return session ? new Date(session.date).toDateString() : "";
      })
      .filter(Boolean)
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let current = 0;
  const cursor = new Date(today);
  const hadActivityToday = dates.has(today.toDateString());
  if (!hadActivityToday) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (dates.has(cursor.toDateString())) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
    while (cursor.getDay() === 0 || cursor.getDay() === 6) {
      cursor.setDate(cursor.getDate() - 1);
    }
  }
  let longest = 0;
  let run = 0;
  const d = new Date(today);
  d.setDate(d.getDate() - 120);
  const end = new Date(today);
  end.setDate(end.getDate() + 1);
  while (d < end) {
    if (d.getDay() === 0 || d.getDay() === 6) {
      d.setDate(d.getDate() + 1);
      continue;
    }
    if (dates.has(d.toDateString())) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
    d.setDate(d.getDate() + 1);
  }
  return {
    currentStreak: current,
    longestStreak: Math.max(longest, current),
    lastActive: new Date().toISOString(),
  };
}

export async function getStudentLearningStats(
  studentId: string
): Promise<StudentLearningStats> {
  await delay(300);
  const metrics = computeStudentMetrics(studentId);
  const streak = getStreak(studentId);
  return {
    totalAssignments: dbSubmissions.filter(
      (s) => s.studentId === studentId
    ).length,
    submittedCount: metrics.totalSubmissions,
    onTimeCount: metrics.onTimeSubmissions,
    totalQuizzes: dbQuizAttempts.filter((a) => a.studentId === studentId).length,
    quizTakenCount: metrics.quizCount,
    avgQuizScore: metrics.avgQuizScore,
    attendanceRate: metrics.attendanceRate,
    xp: metrics.xp,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
  };
}

export async function getTopStudentMetrics(): Promise<StudentMetrics> {
  await delay(150);
  let best = computeStudentMetrics("u-s01");
  for (const user of dbUsers) {
    if (user.role !== "student") continue;
    const metrics = computeStudentMetrics(user.uid);
    if (metrics.xp > best.xp) best = metrics;
  }
  return best;
}

export async function getAllStudentMetrics(): Promise<StudentMetrics[]> {
  await delay(250);
  return dbUsers
    .filter((u) => u.role === "student")
    .map((u) => computeStudentMetrics(u.uid));
}

export async function recordUserAchievement(
  userId: string,
  achievementId: string
): Promise<void> {
  const exists = dbUserAchievements.some(
    (a) => a.userId === userId && a.achievementId === achievementId
  );
  if (exists) return;
  dbUserAchievements.push({
    userId,
    achievementId,
    unlockedAt: new Date().toISOString(),
  } satisfies UserAchievement);
}

export { computeStudentMetrics };
