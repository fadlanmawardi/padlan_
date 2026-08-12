import type {
  StudyNote,
  StudyTarget,
  TaskBookmark,
} from "@/types";
import {
  dbAssignments,
  dbBookmarks,
  dbStudyNotes,
  dbStudyTargets,
  delay,
  findByUser,
  nextId,
} from "./store";

/* ===================== Bookmark Tugas ===================== */

export interface BookmarkView {
  bookmarkId: string;
  assignmentId: string;
  title: string;
  subject: string;
  deadline: string;
  createdAt: string;
}

export async function getStudentBookmarks(
  studentId: string
): Promise<BookmarkView[]> {
  await delay();
  return dbBookmarks
    .filter((b) => b.studentId === studentId)
    .map((bookmark) => {
      const assignment = dbAssignments.find((a) => a.id === bookmark.assignmentId);
      return {
        bookmarkId: bookmark.id,
        assignmentId: bookmark.assignmentId,
        title: assignment?.title ?? "Tugas telah dihapus",
        subject: assignment?.subject ?? "-",
        deadline: assignment?.deadline ?? new Date().toISOString(),
        createdAt: bookmark.createdAt,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function isBookmarked(
  studentId: string,
  assignmentId: string
): Promise<boolean> {
  await delay(80);
  return dbBookmarks.some(
    (b) => b.studentId === studentId && b.assignmentId === assignmentId
  );
}

export async function toggleBookmark(
  studentId: string,
  assignmentId: string
): Promise<boolean> {
  await delay();
  const existing = dbBookmarks.find(
    (b) => b.studentId === studentId && b.assignmentId === assignmentId
  );
  if (existing) {
    const index = dbBookmarks.indexOf(existing);
    dbBookmarks.splice(index, 1);
    return false;
  }
  dbBookmarks.push({
    id: nextId("bk-", dbBookmarks.map((b) => b.id)),
    studentId,
    assignmentId,
    createdAt: new Date().toISOString(),
  } satisfies TaskBookmark);
  return true;
}

/* ===================== Catatan Belajar ===================== */

export const NOTE_COLORS = [
  "#2563eb",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#0ea5e9",
];

export async function getStudentNotes(studentId: string): Promise<StudyNote[]> {
  await delay();
  return dbStudyNotes
    .filter((n) => n.studentId === studentId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createStudyNote(input: {
  studentId: string;
  title: string;
  content: string;
  color: string;
}): Promise<StudyNote> {
  await delay();
  if (!input.title.trim()) throw new Error("Judul catatan wajib diisi");
  const note: StudyNote = {
    id: nextId("nt-", dbStudyNotes.map((n) => n.id)),
    studentId: input.studentId,
    title: input.title.trim(),
    content: input.content,
    color: input.color,
    updatedAt: new Date().toISOString(),
  };
  dbStudyNotes.push(note);
  return { ...note };
}

export async function updateStudyNote(
  id: string,
  patch: Partial<Pick<StudyNote, "title" | "content" | "color">>
): Promise<StudyNote> {
  await delay();
  const index = dbStudyNotes.findIndex((n) => n.id === id);
  if (index === -1) throw new Error("Catatan tidak ditemukan");
  dbStudyNotes[index] = {
    ...dbStudyNotes[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  return { ...dbStudyNotes[index] };
}

export async function deleteStudyNote(id: string): Promise<void> {
  await delay();
  const index = dbStudyNotes.findIndex((n) => n.id === id);
  if (index !== -1) dbStudyNotes.splice(index, 1);
}

/* ===================== Target Belajar ===================== */

export async function getStudentTargets(
  studentId: string
): Promise<StudyTarget[]> {
  await delay();
  return dbStudyTargets
    .filter((t) => t.studentId === studentId)
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return b.createdAt.localeCompare(a.createdAt);
    });
}

export async function createStudyTarget(input: {
  studentId: string;
  title: string;
  goal: number;
  unit: string;
  deadline?: string;
}): Promise<StudyTarget> {
  await delay();
  if (!input.title.trim()) throw new Error("Judul target wajib diisi");
  const target: StudyTarget = {
    id: nextId("tg-", dbStudyTargets.map((t) => t.id)),
    studentId: input.studentId,
    title: input.title.trim(),
    goal: Math.max(1, input.goal),
    progress: 0,
    unit: input.unit,
    deadline: input.deadline,
    done: false,
    createdAt: new Date().toISOString(),
  };
  dbStudyTargets.push(target);
  return { ...target };
}

export async function updateStudyTargetProgress(
  id: string,
  delta: number
): Promise<StudyTarget> {
  await delay();
  const index = dbStudyTargets.findIndex((t) => t.id === id);
  if (index === -1) throw new Error("Target tidak ditemukan");
  const target = dbStudyTargets[index];
  const next = Math.min(target.goal, Math.max(0, target.progress + delta));
  target.progress = next;
  target.done = next >= target.goal;
  return { ...target };
}

export async function deleteStudyTarget(id: string): Promise<void> {
  await delay();
  const index = dbStudyTargets.findIndex((t) => t.id === id);
  if (index !== -1) dbStudyTargets.splice(index, 1);
}

export async function getStudentByUid(uid: string) {
  await delay(80);
  return findByUser(uid) ?? null;
}
