import type {
  Assignment,
  AssignmentRecord,
  AssignmentStatus,
  CollectionStatus,
  CollectionView,
  StudentTaskState,
  StudentTaskView,
  Submission,
  SubmissionChartDatum,
} from "@/types";
import {
  dbAssignments,
  dbSubmissions,
  dbUsers,
  delay,
  findByUser,
  nextId,
} from "./store";
import { pushNotification } from "./community-service";

function notifyStudentsOfClass(
  className: string,
  input: {
    type: "assignment" | "deadline";
    title: string;
    message: string;
    link?: string;
  }
): void {
  const students = dbUsers.filter(
    (u) => u.role === "student" && u.className === className
  );
  for (const student of students) {
    void pushNotification({
      userId: student.uid,
      type: input.type,
      title: input.type === "assignment" ? "Tugas baru tersedia" : "Deadline tugas diperbarui",
      message: input.message,
      link: input.link ?? `/${student.role}/assignments`,
    });
  }
}

export interface CreateAssignmentInput {
  title: string;
  subject: string;
  description: string;
  className: string;
  teacherId: string;
  deadline: string;
  attachment?: string;
}

export type UpdateAssignmentInput = Partial<
  Omit<Assignment, "id" | "teacherId" | "createdAt">
>;

export interface SaveSubmissionInput {
  assignmentId: string;
  studentId: string;
  fileName?: string;
  notes?: string;
  submit: boolean;
}

export interface GradeSubmissionInput {
  assignmentId: string;
  studentId: string;
  grade?: number;
  gradeComment?: string;
}

function toAssignmentRecord(assignment: Assignment): AssignmentRecord {
  const teacher = findByUser(assignment.teacherId);
  return {
    ...assignment,
    teacherName: teacher?.name ?? "Guru telah dihapus",
  };
}

function getClassStudents(className: string) {
  return dbUsers.filter(
    (u) => u.role === "student" && u.className === className
  );
}

export function computeTaskState(
  assignment: Assignment,
  submission: Submission | null | undefined
): StudentTaskState {
  if (submission?.status === "submitted") {
    if (!submission.submittedAt) return "submitted";
    return new Date(submission.submittedAt) <= new Date(assignment.deadline)
      ? "submitted"
      : "late";
  }
  if (submission?.status === "draft") return "in_progress";
  if (new Date(assignment.deadline).getTime() < Date.now()) return "late";
  return "not_started";
}

export function toCollectionStatus(
  assignment: Assignment,
  submission: Submission | null | undefined
): CollectionStatus {
  if (submission?.status === "submitted") {
    if (!submission.submittedAt) return "submitted";
    return new Date(submission.submittedAt) <= new Date(assignment.deadline)
      ? "submitted"
      : "late";
  }
  return "not_collected";
}

export function countCollection(
  assignment: Assignment
): { collected: number; notCollected: number } {
  const students = getClassStudents(assignment.className);
  const submitted = dbSubmissions.filter(
    (s) => s.assignmentId === assignment.id && s.status === "submitted"
  ).length;
  const collected = Math.min(submitted, students.length);
  return { collected, notCollected: students.length - collected };
}

export async function getAssignments(
  teacherId?: string
): Promise<AssignmentRecord[]> {
  await delay();
  const list = teacherId
    ? dbAssignments.filter((a) => a.teacherId === teacherId)
    : dbAssignments;
  return list
    .map(toAssignmentRecord)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAssignmentById(
  id: string
): Promise<AssignmentRecord | null> {
  await delay(200);
  const assignment = dbAssignments.find((a) => a.id === id);
  return assignment ? toAssignmentRecord(assignment) : null;
}

export async function createAssignment(
  input: CreateAssignmentInput
): Promise<AssignmentRecord> {
  await delay();
  const assignment: Assignment = {
    id: nextId("T-", dbAssignments.map((a) => a.id)),
    title: input.title,
    subject: input.subject,
    description: input.description,
    className: input.className,
    teacherId: input.teacherId,
    deadline: input.deadline,
    attachment: input.attachment,
    status: "open",
    createdAt: new Date().toISOString(),
  };
  dbAssignments.push(assignment);
  const teacher = findByUser(input.teacherId);
  notifyStudentsOfClass(assignment.className, {
    type: "assignment",
    title: "Tugas baru tersedia",
    message: `📝 ${teacher?.name ?? "Guru"} menambahkan tugas '${assignment.title}' (${assignment.subject}).`,
    link: `/student/assignments`,
  });
  return toAssignmentRecord(assignment);
}

export async function updateAssignment(
  id: string,
  patch: UpdateAssignmentInput
): Promise<AssignmentRecord> {
  await delay();
  const index = dbAssignments.findIndex((a) => a.id === id);
  if (index === -1) throw new Error("Tugas tidak ditemukan");
  const previous = dbAssignments[index];
  dbAssignments[index] = { ...previous, ...patch, id };
  if (patch.deadline && patch.deadline !== previous.deadline) {
    const deadlineLabel = new Date(patch.deadline).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    notifyStudentsOfClass(dbAssignments[index].className, {
      type: "deadline",
      title: "Deadline tugas diperbarui",
      message: `⏰ Deadline tugas '${dbAssignments[index].title}' diubah menjadi ${deadlineLabel}.`,
      link: `/student/assignments`,
    });
  }
  return toAssignmentRecord(dbAssignments[index]);
}

export async function setAssignmentStatus(
  id: string,
  status: AssignmentStatus
): Promise<AssignmentRecord> {
  await delay();
  const index = dbAssignments.findIndex((a) => a.id === id);
  if (index === -1) throw new Error("Tugas tidak ditemukan");
  dbAssignments[index] = { ...dbAssignments[index], status, id };
  return toAssignmentRecord(dbAssignments[index]);
}

export async function deleteAssignment(id: string): Promise<void> {
  await delay();
  const index = dbAssignments.findIndex((a) => a.id === id);
  if (index !== -1) dbAssignments.splice(index, 1);
  for (let i = dbSubmissions.length - 1; i >= 0; i--) {
    if (dbSubmissions[i].assignmentId === id) dbSubmissions.splice(i, 1);
  }
}

export async function getStudentTaskViews(
  studentId: string
): Promise<StudentTaskView[]> {
  await delay();
  const student = findByUser(studentId);
  if (!student) return [];
  const className = student.className;
  const list = dbAssignments
    .filter((a) => !className || a.className === className)
    .map((assignment) => {
      const submission =
        dbSubmissions.find(
          (s) =>
            s.assignmentId === assignment.id && s.studentId === studentId
        ) ?? null;
      return {
        ...toAssignmentRecord(assignment),
        submission,
        taskState: computeTaskState(assignment, submission),
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return list;
}

export async function getCollection(
  assignmentId: string
): Promise<CollectionView[]> {
  await delay();
  const assignment = dbAssignments.find((a) => a.id === assignmentId);
  if (!assignment) throw new Error("Tugas tidak ditemukan");
  const students = getClassStudents(assignment.className).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  return students.map((student) => {
    const submission =
      dbSubmissions.find(
        (s) =>
          s.assignmentId === assignmentId && s.studentId === student.uid
      ) ?? null;
    return {
      studentId: student.uid,
      studentName: student.name,
      nis: student.nis,
      className: student.className,
      submission,
      status: toCollectionStatus(assignment, submission),
    };
  });
}

export async function getStudentSubmission(
  assignmentId: string,
  studentId: string
): Promise<Submission | null> {
  await delay(150);
  const submission = dbSubmissions.find(
    (s) => s.assignmentId === assignmentId && s.studentId === studentId
  );
  return submission ? { ...submission } : null;
}

export async function saveSubmission(
  input: SaveSubmissionInput
): Promise<Submission> {
  await delay();
  const assignment = dbAssignments.find((a) => a.id === input.assignmentId);
  if (!assignment) throw new Error("Tugas tidak ditemukan");
  const index = dbSubmissions.findIndex(
    (s) =>
      s.assignmentId === input.assignmentId && s.studentId === input.studentId
  );
  const existing = index >= 0 ? dbSubmissions[index] : undefined;

  if (input.submit && assignment.status === "closed") {
    throw new Error("Tugas sudah ditutup oleh guru, tidak dapat dikumpulkan");
  }
  if (!input.fileName?.trim() && !existing?.fileName) {
    throw new Error("Lampiran tugas wajib diunggah");
  }

  const now = new Date();
  const submission: Submission = {
    id: existing?.id ?? nextId("SB-", dbSubmissions.map((s) => s.id)),
    assignmentId: input.assignmentId,
    studentId: input.studentId,
    fileName: input.fileName?.trim() || existing?.fileName,
    notes: input.notes,
    submittedAt: input.submit
      ? now.toISOString()
      : existing?.status === "submitted"
        ? existing.submittedAt
        : undefined,
    status: input.submit ? "submitted" : "draft",
    grade: existing?.grade,
    gradeComment: existing?.gradeComment,
    gradedAt: existing?.gradedAt,
    updatedAt: now.toISOString(),
  };

  if (existing) {
    dbSubmissions[index] = submission;
  } else {
    dbSubmissions.push(submission);
  }

  if (input.submit) {
    const student = findByUser(input.studentId);
    void pushNotification({
      userId: assignment.teacherId,
      type: "assignment",
      title: "Pengumpulan tugas baru",
      message: `📤 ${student?.name ?? "Siswa"} mengumpulkan tugas '${assignment.title}'.`,
      link: `/admin/assignments`,
    });
  }

  return { ...submission };
}

export async function gradeSubmission(
  input: GradeSubmissionInput
): Promise<Submission> {
  await delay();
  const index = dbSubmissions.findIndex(
    (s) =>
      s.assignmentId === input.assignmentId && s.studentId === input.studentId
  );
  if (index === -1) throw new Error("Pengumpulan tidak ditemukan");
  const submission = dbSubmissions[index];
  if (submission.status !== "submitted") {
    throw new Error("Siswa belum mengumpulkan tugas, belum bisa dinilai");
  }
  if (
    input.grade !== undefined &&
    (Number.isNaN(input.grade) || input.grade < 0 || input.grade > 100)
  ) {
    throw new Error("Nilai harus berupa angka antara 0 sampai 100");
  }
  const updated: Submission = {
    ...submission,
    grade: input.grade,
    gradeComment: input.gradeComment?.trim() || undefined,
    gradedAt: new Date().toISOString(),
  };
  dbSubmissions[index] = updated;

  if (input.grade !== undefined) {
    const assignment = dbAssignments.find((a) => a.id === input.assignmentId);
    void pushNotification({
      userId: input.studentId,
      type: "grade",
      title: "Nilai baru tersedia",
      message: `📊 Nilai tugas '${assignment?.title ?? "tugas"}' kamu sudah keluar: ${input.grade}.`,
      link: `/student/grades`,
    });
  }

  return { ...updated };
}

export async function getGradedSubmission(
  assignmentId: string,
  studentId: string
): Promise<Submission | null> {
  await delay(120);
  const submission = dbSubmissions.find(
    (s) => s.assignmentId === assignmentId && s.studentId === studentId
  );
  return submission && submission.status === "submitted" && submission.grade !== undefined
    ? { ...submission }
    : null;
}

export async function getAssignmentSubmissionChart(
  limit = 6
): Promise<SubmissionChartDatum[]> {
  await delay(200);
  return dbAssignments
    .slice(-limit)
    .map((assignment) => {
      const { collected, notCollected } = countCollection(assignment);
      return {
        label: assignment.title.length > 18
          ? `${assignment.title.slice(0, 18)}…`
          : assignment.title,
        submitted: collected,
        notCollected,
      };
    });
}
