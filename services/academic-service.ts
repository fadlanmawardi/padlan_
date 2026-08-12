import type {
  AcademicEvent,
  AcademicEventType,
  ExamSchedule,
  ExamScheduleRecord,
  Grade,
  GradeRecord,
  GradeType,
  ScheduleEntry,
  ScheduleEntryRecord,
  StudentGradeSummary,
  Subject,
  SubjectGradeSummary,
  SubjectRecord,
} from "@/types";
import {
  dbAcademicEvents,
  dbAssignments,
  dbExamSchedules,
  dbGrades,
  dbMaterials,
  dbScheduleEntries,
  dbSubjects,
  dbUsers,
  delay,
  findByUser,
  nextId,
} from "./store";
import {
  KKM,
  gradePredicate,
  gradePredicateLabel,
  isPassed,
} from "@/lib/academics";
import { pushNotification } from "./community-service";

/* ===================== Mata Pelajaran ===================== */

export interface CreateSubjectInput {
  name: string;
  code: string;
  description: string;
  color: string;
  teacherId: string;
  gradeLevel: string;
}

function toSubjectRecord(subject: Subject): SubjectRecord {
  const teacher = findByUser(subject.teacherId);
  return {
    ...subject,
    teacherName: teacher?.name ?? "Guru telah dihapus",
    scheduleCount: dbScheduleEntries.filter(
      (entry) => entry.subjectId === subject.id
    ).length,
    materialCount: dbMaterials.filter(
      (material) => material.subjectId === subject.id
    ).length,
  };
}

export async function getSubjects(): Promise<SubjectRecord[]> {
  await delay();
  return dbSubjects.map(toSubjectRecord).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getSubjectById(id: string): Promise<Subject | null> {
  await delay(150);
  const subject = dbSubjects.find((s) => s.id === id);
  return subject ? { ...subject } : null;
}

export async function createSubject(input: CreateSubjectInput): Promise<SubjectRecord> {
  await delay();
  const subject: Subject = {
    id: nextId("subj-", dbSubjects.map((s) => s.id)),
    name: input.name,
    code: input.code,
    description: input.description,
    color: input.color,
    teacherId: input.teacherId,
    gradeLevel: input.gradeLevel,
    createdAt: new Date().toISOString(),
  };
  dbSubjects.push(subject);
  return toSubjectRecord(subject);
}

export async function updateSubject(
  id: string,
  patch: Partial<Omit<Subject, "id" | "createdAt">>
): Promise<SubjectRecord> {
  await delay();
  const index = dbSubjects.findIndex((s) => s.id === id);
  if (index === -1) throw new Error("Mata pelajaran tidak ditemukan");
  dbSubjects[index] = { ...dbSubjects[index], ...patch, id };
  return toSubjectRecord(dbSubjects[index]);
}

export async function deleteSubject(id: string): Promise<void> {
  await delay();
  const index = dbSubjects.findIndex((s) => s.id === id);
  if (index !== -1) dbSubjects.splice(index, 1);
  for (let i = dbScheduleEntries.length - 1; i >= 0; i--) {
    if (dbScheduleEntries[i].subjectId === id) dbScheduleEntries.splice(i, 1);
  }
}

/* ===================== Jadwal Pelajaran ===================== */

export interface CreateScheduleInput {
  subjectId: string;
  teacherId: string;
  className: string;
  day: number;
  startTime: string;
  endTime: string;
  room: string;
}

function toScheduleRecord(entry: ScheduleEntry): ScheduleEntryRecord {
  const subject = dbSubjects.find((s) => s.id === entry.subjectId);
  const teacher = findByUser(entry.teacherId);
  return {
    ...entry,
    subjectName: subject?.name ?? "Mata pelajaran telah dihapus",
    teacherName: teacher?.name ?? "Guru telah dihapus",
    color: subject?.color ?? "#64748b",
  };
}

export async function getSchedules(
  className?: string
): Promise<ScheduleEntryRecord[]> {
  await delay();
  const list = className
    ? dbScheduleEntries.filter((entry) => entry.className === className)
    : dbScheduleEntries;
  return list.map(toScheduleRecord);
}

export async function getScheduleByClass(className: string): Promise<ScheduleEntryRecord[]> {
  await delay(200);
  return dbScheduleEntries
    .filter((entry) => entry.className === className)
    .map(toScheduleRecord);
}

export async function createScheduleEntry(
  input: CreateScheduleInput
): Promise<ScheduleEntryRecord> {
  await delay();
  const entry: ScheduleEntry = {
    id: nextId("sch-", dbScheduleEntries.map((e) => e.id)),
    ...input,
  };
  dbScheduleEntries.push(entry);
  return toScheduleRecord(entry);
}

export async function updateScheduleEntry(
  id: string,
  patch: Partial<Omit<ScheduleEntry, "id">>
): Promise<ScheduleEntryRecord> {
  await delay();
  const index = dbScheduleEntries.findIndex((e) => e.id === id);
  if (index === -1) throw new Error("Jadwal tidak ditemukan");
  dbScheduleEntries[index] = { ...dbScheduleEntries[index], ...patch, id };
  return toScheduleRecord(dbScheduleEntries[index]);
}

export async function deleteScheduleEntry(id: string): Promise<void> {
  await delay();
  const index = dbScheduleEntries.findIndex((e) => e.id === id);
  if (index !== -1) dbScheduleEntries.splice(index, 1);
}

/* ===================== Kalender Akademik ===================== */

export const ACADEMIC_EVENT_META: Record<
  AcademicEventType,
  { label: string; color: string; dot: string }
> = {
  deadline: { label: "Deadline", color: "#ef4444", dot: "bg-red-500" },
  exam: { label: "Ujian", color: "#8b5cf6", dot: "bg-violet-500" },
  holiday: { label: "Libur", color: "#10b981", dot: "bg-emerald-500" },
  event: { label: "Event", color: "#f59e0b", dot: "bg-amber-500" },
  announcement: { label: "Pengumuman", color: "#0ea5e9", dot: "bg-sky-500" },
};

export async function getAcademicEvents(
  type?: AcademicEventType
): Promise<AcademicEvent[]> {
  await delay();
  const list = type
    ? dbAcademicEvents.filter((event) => event.type === type)
    : dbAcademicEvents;
  return [...list].sort((a, b) => a.date.localeCompare(b.date)).map((e) => ({ ...e }));
}

export async function createAcademicEvent(
  input: Omit<AcademicEvent, "id">
): Promise<AcademicEvent> {
  await delay();
  const event: AcademicEvent = {
    id: nextId("ev-", dbAcademicEvents.map((e) => e.id)),
    ...input,
  };
  dbAcademicEvents.push(event);
  return { ...event };
}

export async function updateAcademicEvent(
  id: string,
  patch: Partial<Omit<AcademicEvent, "id">>
): Promise<AcademicEvent> {
  await delay();
  const index = dbAcademicEvents.findIndex((e) => e.id === id);
  if (index === -1) throw new Error("Event tidak ditemukan");
  dbAcademicEvents[index] = { ...dbAcademicEvents[index], ...patch, id };
  return { ...dbAcademicEvents[index] };
}

export async function deleteAcademicEvent(id: string): Promise<void> {
  await delay();
  const index = dbAcademicEvents.findIndex((e) => e.id === id);
  if (index !== -1) dbAcademicEvents.splice(index, 1);
}

/* ===================== Jadwal Ujian ===================== */

function toExamRecord(exam: ExamSchedule): ExamScheduleRecord {
  const subject = dbSubjects.find((s) => s.id === exam.subjectId);
  return {
    ...exam,
    subjectName: subject?.name ?? "Mata pelajaran telah dihapus",
    color: subject?.color ?? "#64748b",
  };
}

export async function getExamSchedules(
  className?: string
): Promise<ExamScheduleRecord[]> {
  await delay();
  const list = className
    ? dbExamSchedules.filter((exam) => exam.className === className)
    : dbExamSchedules;
  return [...list]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(toExamRecord);
}

export async function createExamSchedule(
  input: Omit<ExamSchedule, "id">
): Promise<ExamScheduleRecord> {
  await delay();
  const exam: ExamSchedule = {
    id: nextId("ex-", dbExamSchedules.map((e) => e.id)),
    ...input,
  };
  dbExamSchedules.push(exam);
  return toExamRecord(exam);
}

export async function updateExamSchedule(
  id: string,
  patch: Partial<Omit<ExamSchedule, "id">>
): Promise<ExamScheduleRecord> {
  await delay();
  const index = dbExamSchedules.findIndex((e) => e.id === id);
  if (index === -1) throw new Error("Jadwal ujian tidak ditemukan");
  dbExamSchedules[index] = { ...dbExamSchedules[index], ...patch, id };
  return toExamRecord(dbExamSchedules[index]);
}

export async function deleteExamSchedule(id: string): Promise<void> {
  await delay();
  const index = dbExamSchedules.findIndex((e) => e.id === id);
  if (index !== -1) dbExamSchedules.splice(index, 1);
}

/* ===================== Nilai ===================== */

export interface CreateGradeInput {
  studentId: string;
  subjectId: string;
  teacherId: string;
  type: GradeType;
  score: number;
  comment?: string;
}

function toGradeRecord(grade: Grade): GradeRecord {
  const student = findByUser(grade.studentId);
  const subject = dbSubjects.find((s) => s.id === grade.subjectId);
  const teacher = findByUser(grade.teacherId);
  return {
    ...grade,
    studentName: student?.name ?? "Siswa telah dihapus",
    className: student?.className ?? "-",
    subjectName: subject?.name ?? "Mata pelajaran telah dihapus",
    teacherName: teacher?.name ?? "Guru telah dihapus",
  };
}

export async function getGrades(filters?: {
  className?: string;
  subjectId?: string;
  studentId?: string;
  type?: GradeType;
}): Promise<GradeRecord[]> {
  await delay();
  let list = dbGrades;
  if (filters?.className) {
    const uids = new Set(
      dbUsers
        .filter((u) => u.role === "student" && u.className === filters.className)
        .map((u) => u.uid)
    );
    list = list.filter((g) => uids.has(g.studentId));
  }
  if (filters?.subjectId) list = list.filter((g) => g.subjectId === filters.subjectId);
  if (filters?.studentId) list = list.filter((g) => g.studentId === filters.studentId);
  if (filters?.type) list = list.filter((g) => g.type === filters.type);
  return [...list].reverse().map(toGradeRecord);
}

export async function createGrade(input: CreateGradeInput): Promise<GradeRecord> {
  await delay();
  if (
    Number.isNaN(input.score) ||
    input.score < 0 ||
    input.score > 100
  ) {
    throw new Error("Nilai harus berupa angka antara 0 sampai 100");
  }
  const grade: Grade = {
    id: nextId("gr-", dbGrades.map((g) => g.id)),
    ...input,
    gradedAt: new Date().toISOString(),
  };
  dbGrades.push(grade);

  const subject = dbSubjects.find((s) => s.id === input.subjectId);
  void pushNotification({
    userId: input.studentId,
    type: "grade",
    title: "Nilai baru tersedia",
    message: `📊 Nilai ${input.type.toUpperCase()} ${subject?.name ?? "mapel"} kamu: ${input.score}.`,
    link: `/student/grades`,
  });

  return toGradeRecord(grade);
}

export async function updateGrade(
  id: string,
  patch: Partial<Omit<Grade, "id">>
): Promise<GradeRecord> {
  await delay();
  if (
    patch.score !== undefined &&
    (Number.isNaN(patch.score) || patch.score < 0 || patch.score > 100)
  ) {
    throw new Error("Nilai harus berupa angka antara 0 sampai 100");
  }
  const index = dbGrades.findIndex((g) => g.id === id);
  if (index === -1) throw new Error("Nilai tidak ditemukan");
  dbGrades[index] = { ...dbGrades[index], ...patch, id };
  return toGradeRecord(dbGrades[index]);
}

export async function deleteGrade(id: string): Promise<void> {
  await delay();
  const index = dbGrades.findIndex((g) => g.id === id);
  if (index !== -1) dbGrades.splice(index, 1);
}

export async function getStudentGrades(
  studentId: string
): Promise<GradeRecord[]> {
  await delay(200);
  return dbGrades
    .filter((g) => g.studentId === studentId)
    .map(toGradeRecord)
    .sort((a, b) => b.gradedAt.localeCompare(a.gradedAt));
}

export interface GradebookRow {
  studentId: string;
  studentName: string;
  nis?: string;
  subjects: {
    subjectId: string;
    subjectName: string;
    color: string;
    average: number;
  }[];
  overallAverage: number;
}

export async function getGradebookByClass(
  className: string
): Promise<GradebookRow[]> {
  await delay();
  const students = dbUsers.filter(
    (u) => u.role === "student" && u.className === className
  );
  return students
    .map((student) => {
      const studentGrades = dbGrades.filter((g) => g.studentId === student.uid);
      const subjectMap = new Map<
        string,
        { subjectId: string; subjectName: string; color: string; total: number; count: number }
      >();
      for (const grade of studentGrades) {
        const subject = dbSubjects.find((s) => s.id === grade.subjectId);
        const existing = subjectMap.get(grade.subjectId);
        if (existing) {
          existing.total += grade.score;
          existing.count += 1;
        } else {
          subjectMap.set(grade.subjectId, {
            subjectId: grade.subjectId,
            subjectName: subject?.name ?? "?",
            color: subject?.color ?? "#64748b",
            total: grade.score,
            count: 1,
          });
        }
      }
      const subjects = [...subjectMap.values()].map((entry) => ({
        ...entry,
        average: Math.round(entry.total / entry.count),
      }));
      const scores = subjects.map((s) => s.average);
      const overallAverage =
        scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length) : 0;
      return {
        studentId: student.uid,
        studentName: student.name,
        nis: student.nis,
        subjects,
        overallAverage,
      };
    })
    .sort((a, b) => b.overallAverage - a.overallAverage);
}

export async function getStudentGradeSummary(
  studentId: string
): Promise<StudentGradeSummary> {
  await delay(250);
  const studentGrades = dbGrades.filter((g) => g.studentId === studentId);
  const perSubject: SubjectGradeSummary[] = [];
  const subjectOrder = new Map<string, number>();
  for (const grade of studentGrades) {
    const subject = dbSubjects.find((s) => s.id === grade.subjectId);
    if (!subject) continue;
    if (!subjectOrder.has(subject.id)) subjectOrder.set(subject.id, perSubject.length);
    const idx = subjectOrder.get(subject.id)!;
    if (!perSubject[idx]) {
      perSubject[idx] = {
        subjectId: subject.id,
        subjectName: subject.name,
        color: subject.color,
        scores: [],
        average: 0,
        predicate: "C",
      };
    }
    perSubject[idx].scores.push(toGradeRecord(grade));
  }
  for (const group of perSubject) {
    const avg = Math.round(
      group.scores.reduce((sum, g) => sum + g.score, 0) / group.scores.length
    );
    group.average = avg;
    group.predicate = gradePredicate(avg);
  }
  const averages = perSubject.map((p) => p.average);
  const average =
    averages.length > 0
      ? Math.round(averages.reduce((sum, a) => sum + a, 0) / averages.length)
      : 0;
  return {
    totalGrades: studentGrades.length,
    average,
    predicate: gradePredicate(average),
    status: isPassed(average) ? "lulus" : "belum",
    perSubject,
  };
}

export interface ReportCardRow {
  subjectId: string;
  subjectName: string;
  teacherName: string;
  color: string;
  scores: { type: GradeType; label: string; score: number }[];
  average: number;
  predicate: string;
  passed: boolean;
}

export interface ReportCardData {
  studentId: string;
  studentName: string;
  nis?: string;
  className: string;
  rows: ReportCardRow[];
  totalAverage: number;
  overallPredicate: string;
  status: "lulus" | "belum";
}

const GRADE_TYPE_LABELS: Record<GradeType, string> = {
  tugas: "Tugas",
  uts: "UTS",
  uas: "UAS",
  quiz: "Quiz",
};

export async function getStudentReportCard(
  studentId: string
): Promise<ReportCardData | null> {
  await delay(250);
  const student = findByUser(studentId);
  if (!student) return null;
  const studentGrades = dbGrades.filter((g) => g.studentId === studentId);
  const rows: ReportCardRow[] = [];
  const subjectOrder = new Map<string, number>();
  for (const grade of studentGrades) {
    const subject = dbSubjects.find((s) => s.id === grade.subjectId);
    if (!subject) continue;
    if (!subjectOrder.has(subject.id)) subjectOrder.set(subject.id, rows.length);
    const idx = subjectOrder.get(subject.id)!;
    if (!rows[idx]) {
      const teacher = findByUser(subject.teacherId);
      rows[idx] = {
        subjectId: subject.id,
        subjectName: subject.name,
        teacherName: teacher?.name ?? "-",
        color: subject.color,
        scores: [],
        average: 0,
        predicate: "C",
        passed: true,
      };
    }
    rows[idx].scores.push({
      type: grade.type,
      label: GRADE_TYPE_LABELS[grade.type],
      score: grade.score,
    });
  }
  for (const row of rows) {
    row.scores.sort(
      (a, b) => Object.keys(GRADE_TYPE_LABELS).indexOf(a.type) - Object.keys(GRADE_TYPE_LABELS).indexOf(b.type)
    );
    const avg = Math.round(
      row.scores.reduce((sum, s) => sum + s.score, 0) / row.scores.length
    );
    row.average = avg;
    row.predicate = gradePredicate(avg);
    row.passed = isPassed(avg);
  }
  const averages = rows.map((r) => r.average);
  const totalAverage =
    averages.length > 0
      ? Math.round(averages.reduce((sum, a) => sum + a, 0) / averages.length)
      : 0;
  return {
    studentId: student.uid,
    studentName: student.name,
    nis: student.nis,
    className: student.className ?? "-",
    rows,
    totalAverage,
    overallPredicate: gradePredicate(totalAverage),
    status: isPassed(totalAverage) ? "lulus" : "belum",
  };
}

export { gradePredicateLabel, KKM, isPassed };

/* ===================== Utilitas turunan ===================== */

export async function getUpcomingDeadlines(
  limit = 6,
  className?: string
): Promise<
  { id: string; title: string; subject: string; className: string; deadline: string }[]
> {
  await delay(200);
  const now = Date.now();
  const list = dbAssignments
    .filter((a) => {
      if (className && a.className !== className) return false;
      return new Date(a.deadline).getTime() >= now - 24 * 60 * 60 * 1000;
    })
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, limit)
    .map((a) => ({
      id: a.id,
      title: a.title,
      subject: a.subject,
      className: a.className,
      deadline: a.deadline,
    }));
  return list;
}

export async function getUpcomingExams(
  limit = 6,
  className?: string
): Promise<ExamScheduleRecord[]> {
  await delay(200);
  const now = new Date().toISOString().slice(0, 10);
  return dbExamSchedules
    .filter((e) => {
      if (className && e.className !== className) return false;
      return e.date >= now;
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit)
    .map(toExamRecord);
}
