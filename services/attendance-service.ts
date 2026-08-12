import type {
  AttendanceRecord,
  AttendanceRecordView,
  AttendanceRecapRow,
  AttendanceSession,
  AttendanceSessionRecord,
  AttendanceStatus,
  StudentAttendanceRecord,
  StudentAttendanceSummary,
  AttendanceAchievementView,
  AttendanceInsight,
  StudentAttendanceDay,
  AttendanceChartDatum,
  AttendanceStudentRow,
  AttendanceTopRow,
  SuperAdminAttendanceAnalytics,
} from "@/types";
import {
  dbAttendanceRecords,
  dbAttendanceSessions,
  dbUsers,
  delay,
  findByUser,
  nextId,
} from "./store";
import { pushNotification } from "./community-service";
import { dataChanged } from "./realtime-service";
import { ACHIEVEMENT_DEFS } from "./gamification-service";
import { getStreak } from "./gamification-service";
import { dateKey } from "@/lib/academics";

function todayDateKey(): string {
  return dateKey(new Date());
}

export interface CreateAttendanceInput {
  date: string;
  className: string;
  teacherId: string;
}

export type UpdateAttendanceInput = Partial<
  Omit<AttendanceSession, "id" | "createdAt">
>;

function toSessionRecord(session: AttendanceSession): AttendanceSessionRecord {
  const teacher = findByUser(session.teacherId);
  const records = dbAttendanceRecords.filter(
    (r) => r.sessionId === session.id
  );
  return {
    ...session,
    teacherName: teacher?.name ?? "Guru telah dihapus",
    totalStudents: records.length,
    presentCount: records.filter((r) => r.status === "present").length,
    lateCount: records.filter((r) => r.status === "late").length,
    permissionCount: records.filter((r) => r.status === "permission").length,
    sickCount: records.filter((r) => r.status === "sick").length,
    absentCount: records.filter((r) => r.status === "absent").length,
  };
}

function getClassStudents(className: string) {
  return dbUsers.filter(
    (u) => u.role === "student" && u.className === className
  );
}

export async function getAttendanceSessions(
  teacherId?: string
): Promise<AttendanceSessionRecord[]> {
  await delay();
  const list = teacherId
    ? dbAttendanceSessions.filter((s) => s.teacherId === teacherId)
    : dbAttendanceSessions;
  return list
    .map(toSessionRecord)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getAttendanceSessionById(
  id: string
): Promise<AttendanceSessionRecord | null> {
  await delay(200);
  const session = dbAttendanceSessions.find((s) => s.id === id);
  return session ? toSessionRecord(session) : null;
}

export async function createAttendanceSession(
  input: CreateAttendanceInput
): Promise<AttendanceSessionRecord> {
  await delay();
  const session: AttendanceSession = {
    id: nextId("AB-", dbAttendanceSessions.map((s) => s.id)),
    date: input.date,
    className: input.className,
    teacherId: input.teacherId,
    status: "open",
    createdAt: new Date().toISOString(),
  };
  dbAttendanceSessions.push(session);
  for (const student of getClassStudents(input.className)) {
    dbAttendanceRecords.push({
      id: `AR-${session.id}-${student.uid}`,
      sessionId: session.id,
      studentId: student.uid,
      status: "absent",
      createdAt: session.createdAt,
    });
  }

  const teacher = findByUser(input.teacherId);
  for (const student of getClassStudents(input.className)) {
    void pushNotification({
      userId: student.uid,
      type: "attendance",
      title: "Absensi telah dibuka",
      message: `📍 Absensi ${session.className} telah dibuka oleh ${teacher?.name ?? "guru"}. Silakan absen sekarang.`,
      link: `/student/attendance`,
    });
  }

  dataChanged("attendance");

  return toSessionRecord(session);
}

export async function updateAttendanceSession(
  id: string,
  patch: UpdateAttendanceInput
): Promise<AttendanceSessionRecord> {
  await delay();
  const index = dbAttendanceSessions.findIndex((s) => s.id === id);
  if (index === -1) throw new Error("Absensi tidak ditemukan");
  const current = dbAttendanceSessions[index];
  const next = { ...current, ...patch, id };
  dbAttendanceSessions[index] = next;

  if (patch.className && patch.className !== current.className) {
    for (let i = dbAttendanceRecords.length - 1; i >= 0; i--) {
      if (dbAttendanceRecords[i].sessionId === id) {
        dbAttendanceRecords.splice(i, 1);
      }
    }
    for (const student of getClassStudents(next.className)) {
      dbAttendanceRecords.push({
        id: `AR-${id}-${student.uid}`,
        sessionId: id,
        studentId: student.uid,
        status: "absent",
        createdAt: next.createdAt,
      });
    }
  }
  return toSessionRecord(next);
}

export async function setSessionStatus(
  id: string,
  status: AttendanceSession["status"]
): Promise<AttendanceSessionRecord> {
  await delay();
  const index = dbAttendanceSessions.findIndex((s) => s.id === id);
  if (index === -1) throw new Error("Absensi tidak ditemukan");
  dbAttendanceSessions[index] = { ...dbAttendanceSessions[index], status, id };

  if (status === "closed") {
    const session = dbAttendanceSessions[index];
    const students = getClassStudents(session.className);
    for (const student of students) {
      void pushNotification({
        userId: student.uid,
        type: "attendance",
        title: "Absensi ditutup",
        message: `🔒 Sesi absensi ${session.className} telah ditutup oleh guru.`,
        link: `/student/attendance`,
      });
    }
  }

  dataChanged("attendance");

  return toSessionRecord(dbAttendanceSessions[index]);
}

export async function deleteAttendanceSession(id: string): Promise<void> {
  await delay();
  const index = dbAttendanceSessions.findIndex((s) => s.id === id);
  if (index !== -1) dbAttendanceSessions.splice(index, 1);
  for (let i = dbAttendanceRecords.length - 1; i >= 0; i--) {
    if (dbAttendanceRecords[i].sessionId === id) {
      dbAttendanceRecords.splice(i, 1);
    }
  }
}

export async function getSessionRecords(
  sessionId: string
): Promise<AttendanceRecordView[]> {
  await delay();
  return dbAttendanceRecords
    .filter((r) => r.sessionId === sessionId)
    .map((record) => {
      const student = findByUser(record.studentId);
      return {
        ...record,
        studentName: student?.name ?? "Siswa telah dihapus",
        nis: student?.nis,
        className: student?.className,
      };
    })
    .sort((a, b) => a.studentName.localeCompare(b.studentName));
}

export interface SetStudentStatusOptions {
  /** Penanda bahwa status diubah sendiri oleh siswa (self check-in). */
  self?: boolean;
  teacherNote?: string;
}

export async function setStudentStatus(
  sessionId: string,
  studentId: string,
  status: AttendanceStatus,
  note?: string,
  options: SetStudentStatusOptions = {}
): Promise<AttendanceRecord> {
  await delay(120);
  const index = dbAttendanceRecords.findIndex(
    (r) => r.sessionId === sessionId && r.studentId === studentId
  );
  if (index === -1) throw new Error("Catatan absensi tidak ditemukan");

  const session = dbAttendanceSessions.find((s) => s.id === sessionId);
  if (options.self) {
    if (!session || session.status !== "open") {
      throw new Error("Sesi absensi sudah ditutup");
    }
    if (status !== "present" && status !== "late") {
      throw new Error("Siswa hanya dapat menandai hadir atau terlambat");
    }
    const current = dbAttendanceRecords[index];
    if (
      current.status !== "absent" &&
      (current.checkIn || current.markedBy !== current.studentId)
    ) {
      throw new Error("Absensi sudah tercatat, tidak dapat diulang");
    }
  }

  const now = new Date();
  const isSelfCheckIn = options.self && (status === "present" || status === "late");

  const updated: AttendanceRecord = {
    ...dbAttendanceRecords[index],
    status,
    note,
    checkIn:
      isSelfCheckIn || dbAttendanceRecords[index].checkIn
        ? dbAttendanceRecords[index].checkIn ??
          `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
        : dbAttendanceRecords[index].checkIn,
    teacherNote:
      options.teacherNote !== undefined
        ? options.teacherNote
        : dbAttendanceRecords[index].teacherNote,
    markedBy: isSelfCheckIn ? studentId : dbAttendanceRecords[index].markedBy,
  };
  dbAttendanceRecords[index] = updated;

  if (isSelfCheckIn) {
    const student = findByUser(studentId);
    void pushNotification({
      userId: studentId,
      type: "attendance",
      title: "Absensi berhasil dicatat",
      message: `✅ Absensi kamu tercatat ${status === "late" ? "terlambat" : "hadir"} pada ${updated.checkIn}.`,
      link: `/student/attendance`,
    });

    if (session) {
      const teacher = findByUser(session.teacherId);
      if (teacher) {
        void pushNotification({
          userId: teacher.uid,
          type: "attendance",
          title: "Siswa melakukan absensi",
          message: `👨‍🎓 ${student?.name ?? "Siswa"} telah melakukan absensi (${status === "late" ? "terlambat" : "hadir"}).`,
          link: `/admin/attendance`,
        });
      }
    }
  }

  dataChanged("attendance");

  return { ...updated };
}

/** Self check-in: siswa menandai kehadirannya sendiri (hanya hadir/terlambat). */
export async function selfCheckIn(
  sessionId: string,
  studentId: string,
  status: "present" | "late",
  note?: string
): Promise<AttendanceRecord> {
  return setStudentStatus(sessionId, studentId, status, note, { self: true });
}

/** Sesi absensi yang sedang aktif untuk kelas siswa tertentu. */
export async function getActiveSessionForStudent(
  studentId: string
): Promise<AttendanceSessionRecord | null> {
  await delay(150);
  const student = findByUser(studentId);
  if (!student) return null;
  const today = todayDateKey();
  const session = dbAttendanceSessions.find(
    (s) =>
      s.className === student.className &&
      s.status === "open" &&
      s.date.slice(0, 10) === today
  );
  return session ? toSessionRecord(session) : null;
}

/** Catatan absensi siswa untuk sesi tertentu. */
export async function getRecordForSession(
  sessionId: string,
  studentId: string
): Promise<AttendanceRecordView | null> {
  await delay(100);
  const record = dbAttendanceRecords.find(
    (r) => r.sessionId === sessionId && r.studentId === studentId
  );
  if (!record) return null;
  const student = findByUser(studentId);
  return {
    ...record,
    studentName: student?.name ?? "Siswa",
    nis: student?.nis,
    className: student?.className,
  };
}

export async function markAll(
  sessionId: string,
  status: AttendanceStatus
): Promise<void> {
  await delay();
  for (let i = 0; i < dbAttendanceRecords.length; i++) {
    if (dbAttendanceRecords[i].sessionId === sessionId) {
      dbAttendanceRecords[i] = {
        ...dbAttendanceRecords[i],
        status,
        note: undefined,
      };
    }
  }
  dataChanged("attendance");
}

export async function getAttendanceRecap(): Promise<AttendanceRecapRow[]> {
  await delay();
  const classes = [...new Set(dbAttendanceSessions.map((s) => s.className))];
  return classes.map((className) => {
    const sessions = dbAttendanceSessions.filter(
      (s) => s.className === className
    );
    const sessionIds = new Set(sessions.map((s) => s.id));
    const records = dbAttendanceRecords.filter((r) =>
      sessionIds.has(r.sessionId)
    );
    const present = records.filter((r) => r.status === "present").length;
    const total = records.length;
    return {
      className,
      sessions: sessions.length,
      present,
      late: records.filter((r) => r.status === "late").length,
      permission: records.filter((r) => r.status === "permission").length,
      sick: records.filter((r) => r.status === "sick").length,
      absent: records.filter((r) => r.status === "absent").length,
      total,
      attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
    };
  });
}

export async function getStudentAttendance(
  studentId: string
): Promise<StudentAttendanceSummary> {
  await delay();
  const records = dbAttendanceRecords
    .filter((r) => r.studentId === studentId)
    .map((record) => {
      const session = dbAttendanceSessions.find(
        (s) => s.id === record.sessionId
      );
      const student = findByUser(studentId);
      return {
        ...record,
        sessionDate: session?.date ?? "",
        sessionClassName: session?.className ?? "",
        studentName: student?.name ?? "Siswa",
        nis: student?.nis,
        className: student?.className,
      } satisfies StudentAttendanceRecord;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const present = records.filter((r) => r.status === "present").length;
  const totalSessions = records.length;
  return {
    records,
    totalSessions,
    present,
    late: records.filter((r) => r.status === "late").length,
    permission: records.filter((r) => r.status === "permission").length,
    sick: records.filter((r) => r.status === "sick").length,
    absent: records.filter((r) => r.status === "absent").length,
    percentage:
      totalSessions > 0 ? Math.round((present / totalSessions) * 100) : 0,
  };
}

export async function getTodayAttendance(): Promise<{
  present: number;
  total: number;
}> {
  await delay(150);
  const today = new Date().toDateString();
  const todaySessions = dbAttendanceSessions.filter(
    (s) => new Date(s.date).toDateString() === today
  );
  const sessionIds = new Set(todaySessions.map((s) => s.id));
  const records = dbAttendanceRecords.filter((r) =>
    sessionIds.has(r.sessionId)
  );
  return {
    present: records.filter((r) => r.status === "present").length,
    total: records.length,
  };
}

export async function getAttendanceChart(
  limit = 6
): Promise<AttendanceChartDatum[]> {
  await delay(150);
  const sessions = [...dbAttendanceSessions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
  const formatter = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  });
  return sessions.map((session) => {
    const records = dbAttendanceRecords.filter(
      (r) => r.sessionId === session.id
    );
    const count = (status: AttendanceStatus) =>
      records.filter((r) => r.status === status).length;
    return {
      label: `${session.className} ${formatter.format(new Date(session.date))}`,
      present: count("present"),
      late: count("late"),
      permission: count("permission"),
      sick: count("sick"),
      absent: count("absent"),
    };
  });
}

/* =============================================================
   ANALISIS & INSIGHT ABSENSI
   ============================================================= */

export interface StudentAttendanceInsights {
  summary: StudentAttendanceSummary;
  streak: { current: number; longest: number };
  heatmap: { date: string; value: number }[];
  chart: AttendanceChartDatum[];
  calendarDays: StudentAttendanceDay[];
  achievements: AttendanceAchievementView[];
  insights: AttendanceInsight[];
  today: StudentAttendanceDay | null;
  lastMonthRate: number;
  monthRate: number;
}

export async function getStudentAttendanceInsights(
  studentId: string
): Promise<StudentAttendanceInsights> {
  await delay(250);
  const summary = await getStudentAttendance(studentId);

  const dayByDate = new Map<string, StudentAttendanceDay>();
  for (const record of summary.records) {
    const session = dbAttendanceSessions.find(
      (s) => s.id === record.sessionId
    );
    if (!session) continue;
    const key = session.date.slice(0, 10);
    if (!dayByDate.has(key)) {
      dayByDate.set(key, {
        date: key,
        status: record.status,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        className: session.className,
        teacherName: record.studentName,
        note: record.note ?? record.teacherNote,
      });
    }
  }

  const days = Array.from(dayByDate.entries())
    .map(([, day]) => day)
    .sort((a, b) => a.date.localeCompare(b.date));

  const heatmap = days.map((day) => {
    let value = 0;
    if (day.status === "present") value = 100;
    else if (day.status === "late") value = 60;
    else if (day.status === "permission" || day.status === "sick") value = 35;
    return { date: day.date, value };
  });

  const formatter = new Intl.DateTimeFormat("id-ID", { month: "short" });
  const chart: AttendanceChartDatum[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthDays = days.filter((d) => {
      const t = new Date(`${d.date}T00:00:00`);
      return t >= start && t < end;
    });
    chart.push({
      label: formatter.format(start),
      present: monthDays.filter((d) => d.status === "present").length,
      late: monthDays.filter((d) => d.status === "late").length,
      permission: monthDays.filter((d) => d.status === "permission").length,
      sick: monthDays.filter((d) => d.status === "sick").length,
      absent: monthDays.filter((d) => d.status === "absent").length,
    });
  }

  const streak = getStreak(studentId);

  const totalSessions = summary.totalSessions;
  const presentRate =
    totalSessions > 0 ? (summary.present / totalSessions) * 100 : 0;

  const achievements: AttendanceAchievementView[] = [
    {
      id: ACHIEVEMENT_DEFS[0].id,
      title: ACHIEVEMENT_DEFS[0].title,
      description: ACHIEVEMENT_DEFS[0].description,
      icon: ACHIEVEMENT_DEFS[0].icon,
      xp: ACHIEVEMENT_DEFS[0].xp,
      unlocked: presentRate >= 90,
      progress: Math.round(Math.min(100, presentRate)),
      goal: 90,
    },
    {
      id: ACHIEVEMENT_DEFS[1].id,
      title: ACHIEVEMENT_DEFS[1].title,
      description: ACHIEVEMENT_DEFS[1].description,
      icon: ACHIEVEMENT_DEFS[1].icon,
      xp: ACHIEVEMENT_DEFS[1].xp,
      unlocked: summary.late === 0 && totalSessions > 0,
      progress: 100,
      goal: 100,
    },
    {
      id: ACHIEVEMENT_DEFS[2].id,
      title: ACHIEVEMENT_DEFS[2].title,
      description: ACHIEVEMENT_DEFS[2].description,
      icon: ACHIEVEMENT_DEFS[2].icon,
      xp: ACHIEVEMENT_DEFS[2].xp,
      unlocked: streak.longestStreak >= 30,
      progress: Math.round(Math.min(100, (streak.longestStreak / 30) * 100)),
      goal: 30,
    },
    {
      id: ACHIEVEMENT_DEFS[3].id,
      title: ACHIEVEMENT_DEFS[3].title,
      description: ACHIEVEMENT_DEFS[3].description,
      icon: ACHIEVEMENT_DEFS[3].icon,
      xp: ACHIEVEMENT_DEFS[3].xp,
      unlocked: presentRate >= 95,
      progress: Math.round(Math.min(100, presentRate)),
      goal: 95,
    },
  ];

  const insights: AttendanceInsight[] = [];
  if (presentRate >= 95) {
    insights.push({
      tone: "good",
      title: "Kehadiran luar biasa!",
      message: `🔥 Kamu sudah hadir ${streak.currentStreak} hari berturut-turut. Pertahankan untuk membuka achievement 30 Days Streak!`,
    });
  } else if (presentRate >= 90) {
    insights.push({
      tone: "good",
      title: "Kehadiran sangat baik",
      message: `Kehadiran kamu ${Math.round(presentRate)}% — tetap jaga konsistensinya ya!`,
    });
  } else if (presentRate >= 75) {
    insights.push({
      tone: "warn",
      title: "Perlu sedikit perhatian",
      message: `Kehadiran kamu ${Math.round(presentRate)}%. Usahakan hadir tepat waktu agar tidak tertinggal materi.`,
    });
  } else {
    insights.push({
      tone: "bad",
      title: "Kehadiran perlu diperbaiki",
      message: `Kehadiran kamu baru ${Math.round(presentRate)}%. Segera perbaiki agar tidak bermasalah di rapor.`,
    });
  }
  if (summary.late > 0) {
    insights.push({
      tone: summary.late <= 2 ? "warn" : "bad",
      title: "Jangan terlambat",
      message: `Kamu terlambat ${summary.late} kali. Coba berangkat lebih awal dari biasanya.`,
    });
  } else if (totalSessions > 0) {
    insights.push({
      tone: "good",
      title: "Selalu tepat waktu",
      message: "Kamu tidak pernah terlambat masuk kelas. Great job! 🎉",
    });
  }

  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

  const monthDays = days.filter((d) => d.date.startsWith(currentMonthKey));
  const lastMonthDays = days.filter((d) => d.date.startsWith(lastMonthKey));

  const rateOf = (list: StudentAttendanceDay[]) => {
    if (list.length === 0) return 0;
    const attended = list.filter(
      (d) => d.status === "present" || d.status === "late"
    ).length;
    return Math.round((attended / list.length) * 100);
  };

  const today = days.find((d) => d.date === todayDateKey()) ?? null;

  return {
    summary,
    streak: { current: streak.currentStreak, longest: streak.longestStreak },
    heatmap,
    chart,
    calendarDays: days,
    achievements,
    insights,
    today,
    lastMonthRate: rateOf(lastMonthDays),
    monthRate: rateOf(monthDays),
  };
}

/* =============================================================
   OVERVIEW ADMIN (hari ini)
   ============================================================= */

export interface AdminAttendanceOverview {
  totalStudents: number;
  present: number;
  late: number;
  permission: number;
  sick: number;
  absent: number;
  notMarked: number;
  presentRate: number;
  todaySessions: AttendanceSessionRecord[];
  chart: AttendanceChartDatum[];
  absentStudents: AttendanceRecordView[];
}

export async function getAdminAttendanceOverview(
  teacherId?: string
): Promise<AdminAttendanceOverview> {
  await delay(200);
  const today = todayDateKey();
  let sessions = dbAttendanceSessions.filter(
    (s) => s.date.slice(0, 10) === today
  );
  if (teacherId) sessions = sessions.filter((s) => s.teacherId === teacherId);
  const sessionIds = new Set(sessions.map((s) => s.id));

  const students = dbUsers.filter((u) => u.role === "student");
  const totalStudents = students.length;

  const records = dbAttendanceRecords.filter((r) => sessionIds.has(r.sessionId));
  const present = records.filter((r) => r.status === "present").length;
  const late = records.filter((r) => r.status === "late").length;
  const permission = records.filter((r) => r.status === "permission").length;
  const sick = records.filter((r) => r.status === "sick").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const marked = records.length;

  const absentStudents = records
    .filter((r) => r.status === "absent" || r.status === "permission" || r.status === "sick")
    .map((record) => {
      const student = findByUser(record.studentId);
      return {
        ...record,
        studentName: student?.name ?? "Siswa",
        nis: student?.nis,
        className: student?.className,
      } satisfies AttendanceRecordView;
    });

  return {
    totalStudents,
    present,
    late,
    permission,
    sick,
    absent,
    notMarked: Math.max(0, totalStudents - marked),
    presentRate: marked > 0 ? Math.round(((present + late) / marked) * 100) : 0,
    todaySessions: sessions.map(toSessionRecord),
    chart: await getAttendanceChart(7),
    absentStudents,
  };
}

/* =============================================================
   ANALITIK SUPER ADMIN (seluruh sekolah)
   ============================================================= */

export async function getSuperAdminAttendanceAnalytics(): Promise<SuperAdminAttendanceAnalytics> {
  await delay(250);
  const students = dbUsers.filter(
    (u) => u.role === "student" && u.status === "active"
  );
  const teachers = dbUsers.filter((u) => u.role === "admin");
  const sessions = dbAttendanceSessions;
  const records = dbAttendanceRecords;

  const present = records.filter((r) => r.status === "present").length;
  const late = records.filter((r) => r.status === "late").length;
  const permission = records.filter((r) => r.status === "permission").length;
  const sick = records.filter((r) => r.status === "sick").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const totalRecords = records.length;
  const attendanceRate =
    totalRecords > 0
      ? Math.round(((present + late) / totalRecords) * 100)
      : 0;

  const classes = Array.from(
    new Set(sessions.map((s) => s.className))
  ).sort();

  const classStats = classes.map((className) => {
    const classSessions = sessions.filter((s) => s.className === className);
    const ids = new Set(classSessions.map((s) => s.id));
    const classRecords = records.filter((r) => ids.has(r.sessionId));
    const p = classRecords.filter((r) => r.status === "present").length;
    const rate = classRecords.length > 0 ? (p / classRecords.length) * 100 : 0;
    return { className, rate, present: p, total: classRecords.length };
  });

  const bestClasses: AttendanceTopRow[] = [...classStats]
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 5)
    .map((c) => ({
      className: c.className,
      attendanceRate: Math.round(c.rate),
      present: c.present,
      total: c.total,
    }));
  const worstClasses: AttendanceTopRow[] = [...classStats]
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 5)
    .map((c) => ({
      className: c.className,
      attendanceRate: Math.round(c.rate),
      present: c.present,
      total: c.total,
    }));

  const studentStats = students.map((student) => {
    const studentRecords = records.filter((r) => r.studentId === student.uid);
    const p = studentRecords.filter((r) => r.status === "present").length;
    const l = studentRecords.filter((r) => r.status === "late").length;
    const rate =
      studentRecords.length > 0
        ? ((p + l) / studentRecords.length) * 100
        : 0;
    return {
      uid: student.uid,
      name: student.name,
      className: student.className,
      rate,
      present: p,
      late: l,
      total: studentRecords.length,
    };
  });

  const toRow = (
    s: (typeof studentStats)[number]
  ): AttendanceStudentRow => ({
    uid: s.uid,
    name: s.name,
    className: s.className,
    attendanceRate: Math.round(s.rate),
    present: s.present,
    late: s.late,
    total: s.total,
  });

  const bestStudents = [...studentStats]
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 5)
    .map(toRow);
  const worstStudents = [...studentStats]
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 5)
    .map(toRow);

  return {
    totalStudents: students.length,
    totalTeachers: teachers.length,
    totalSessions: sessions.length,
    totalRecords,
    present,
    late,
    permission,
    sick,
    absent,
    attendanceRate,
    bestClasses,
    worstClasses,
    bestStudents,
    worstStudents,
  };
}

/** Grafik bulanan kehadiran seluruh sekolah. */
export async function getSchoolMonthlyChart(): Promise<AttendanceChartDatum[]> {
  await delay(200);
  const formatter = new Intl.DateTimeFormat("id-ID", { month: "short" });
  const now = new Date();
  const result: AttendanceChartDatum[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthRecords = dbAttendanceRecords.filter((r) => {
      const session = dbAttendanceSessions.find((s) => s.id === r.sessionId);
      if (!session) return false;
      const t = new Date(session.date);
      return t >= start && t < end;
    });
    const count = (status: AttendanceStatus) =>
      monthRecords.filter((r) => r.status === status).length;
    result.push({
      label: formatter.format(start),
      present: count("present"),
      late: count("late"),
      permission: count("permission"),
      sick: count("sick"),
      absent: count("absent"),
    });
  }
  return result;
}

/** Grafik tahunan kehadiran seluruh sekolah. */
export async function getSchoolYearlyChart(): Promise<AttendanceChartDatum[]> {
  await delay(200);
  const formatter = new Intl.DateTimeFormat("id-ID", { year: "numeric" });
  const now = new Date();
  const result: AttendanceChartDatum[] = [];
  for (let i = 2; i >= 0; i--) {
    const year = now.getFullYear() - i;
    const yearRecords = dbAttendanceRecords.filter((r) => {
      const session = dbAttendanceSessions.find((s) => s.id === r.sessionId);
      if (!session) return false;
      return new Date(session.date).getFullYear() === year;
    });
    const count = (status: AttendanceStatus) =>
      yearRecords.filter((r) => r.status === status).length;
    result.push({
      label: formatter.format(new Date(year, 0, 1)),
      present: count("present"),
      late: count("late"),
      permission: count("permission"),
      sick: count("sick"),
      absent: count("absent"),
    });
  }
  return result;
}

/** Heatmap kehadiran seluruh sekolah (per hari). */
export async function getSchoolHeatmap(): Promise<{ date: string; value: number }[]> {
  await delay(200);
  const byDate = new Map<string, { present: number; total: number }>();
  for (const record of dbAttendanceRecords) {
    const session = dbAttendanceSessions.find((s) => s.id === record.sessionId);
    if (!session) continue;
    const key = session.date.slice(0, 10);
    const entry = byDate.get(key) ?? { present: 0, total: 0 };
    entry.total += 1;
    if (record.status === "present" || record.status === "late") {
      entry.present += 1;
    }
    byDate.set(key, entry);
  }
  return Array.from(byDate.entries()).map(([date, entry]) => ({
    date,
    value:
      entry.total > 0 ? Math.round((entry.present / entry.total) * 100) : 0,
  }));
}

/** Timeline perubahan absensi terbaru (untuk audit Super Admin). */
export async function getAttendanceTimeline(
  limit = 20
): Promise<{ id: string; sessionId: string; studentId: string; studentName: string; status: AttendanceStatus; note?: string; className: string; date: string; createdAt: string }[]> {
  await delay(200);
  return dbAttendanceRecords
    .filter((r) => r.status !== "absent" || r.checkIn)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map((record) => {
      const session = dbAttendanceSessions.find((s) => s.id === record.sessionId);
      const student = findByUser(record.studentId);
      return {
        id: record.id,
        sessionId: record.sessionId,
        studentId: record.studentId,
        studentName: student?.name ?? "Siswa",
        status: record.status,
        note: record.note ?? record.teacherNote,
        className: session?.className ?? "",
        date: session?.date ?? "",
        createdAt: record.createdAt,
      };
    });
}
