import type {
  BankQuestion,
  BankQuestionRecord,
  ForumPost,
  ForumThread,
  ForumThreadRecord,
  Material,
  MaterialRecord,
  MaterialType,
  QuestionDifficulty,
  QuestionType,
  Quiz,
  QuizAttempt,
  QuizAttemptRecord,
  QuizQuestion,
  QuizRecord,
  QuizStudentView,
  Rubric,
} from "@/types";
import {
  dbAssignments,
  dbBankQuestions,
  dbForumPosts,
  dbForumThreads,
  dbMaterials,
  dbQuizzes,
  dbQuizAttempts,
  dbRubrics,
  dbSubjects,
  dbUsers,
  delay,
  findByUser,
  nextId,
} from "./store";
import { QUESTION_TYPE_LABELS } from "@/lib/academics";

/* ===================== Bank Soal ===================== */

export interface CreateBankQuestionInput {
  type: QuestionType;
  subjectId: string;
  text: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: QuestionDifficulty;
  points: number;
}

function toBankQuestionRecord(question: BankQuestion): BankQuestionRecord {
  const subject = dbSubjects.find((s) => s.id === question.subjectId);
  return {
    ...question,
    subjectName: subject?.name ?? "Mata pelajaran telah dihapus",
  };
}

export async function getBankQuestions(
  subjectId?: string
): Promise<BankQuestionRecord[]> {
  await delay();
  const list = subjectId
    ? dbBankQuestions.filter((q) => q.subjectId === subjectId)
    : dbBankQuestions;
  return [...list].reverse().map(toBankQuestionRecord);
}

export async function createBankQuestion(
  input: CreateBankQuestionInput
): Promise<BankQuestionRecord> {
  await delay();
  const question: BankQuestion = {
    id: nextId("bq-", dbBankQuestions.map((q) => q.id)),
    ...input,
    createdAt: new Date().toISOString(),
  };
  dbBankQuestions.push(question);
  return toBankQuestionRecord(question);
}

export async function updateBankQuestion(
  id: string,
  patch: Partial<Omit<BankQuestion, "id" | "createdAt">>
): Promise<BankQuestionRecord> {
  await delay();
  const index = dbBankQuestions.findIndex((q) => q.id === id);
  if (index === -1) throw new Error("Soal tidak ditemukan");
  dbBankQuestions[index] = { ...dbBankQuestions[index], ...patch, id };
  return toBankQuestionRecord(dbBankQuestions[index]);
}

export async function deleteBankQuestion(id: string): Promise<void> {
  await delay();
  const index = dbBankQuestions.findIndex((q) => q.id === id);
  if (index !== -1) dbBankQuestions.splice(index, 1);
}

/* ===================== Quiz Online ===================== */

export interface CreateQuizInput {
  title: string;
  description?: string;
  subjectId: string;
  className: string;
  teacherId: string;
  timeLimitMinutes: number;
  dueAt?: string;
  questions: QuizQuestion[];
}

function toQuizRecord(quiz: Quiz): QuizRecord {
  const subject = dbSubjects.find((s) => s.id === quiz.subjectId);
  const teacher = findByUser(quiz.teacherId);
  return {
    ...quiz,
    subjectName: subject?.name ?? "Mata pelajaran telah dihapus",
    teacherName: teacher?.name ?? "Guru telah dihapus",
    questionCount: quiz.questions.length,
  };
}

export async function getQuizzes(
  className?: string
): Promise<QuizRecord[]> {
  await delay();
  const list = className
    ? dbQuizzes.filter((q) => q.className === className)
    : dbQuizzes;
  return [...list]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toQuizRecord);
}

export async function createQuiz(input: CreateQuizInput): Promise<QuizRecord> {
  await delay();
  const quiz: Quiz = {
    id: nextId("qz-", dbQuizzes.map((q) => q.id)),
    ...input,
    createdAt: new Date().toISOString(),
  };
  dbQuizzes.push(quiz);
  return toQuizRecord(quiz);
}

export async function updateQuiz(
  id: string,
  patch: Partial<Omit<Quiz, "id" | "createdAt" | "questions">> & {
    questions?: QuizQuestion[];
  }
): Promise<QuizRecord> {
  await delay();
  const index = dbQuizzes.findIndex((q) => q.id === id);
  if (index === -1) throw new Error("Quiz tidak ditemukan");
  dbQuizzes[index] = { ...dbQuizzes[index], ...patch, id };
  return toQuizRecord(dbQuizzes[index]);
}

export async function deleteQuiz(id: string): Promise<void> {
  await delay();
  const index = dbQuizzes.findIndex((q) => q.id === id);
  if (index !== -1) dbQuizzes.splice(index, 1);
  for (let i = dbQuizAttempts.length - 1; i >= 0; i--) {
    if (dbQuizAttempts[i].quizId === id) dbQuizAttempts.splice(i, 1);
  }
}

export async function getQuizStudentViews(
  studentId: string
): Promise<QuizStudentView[]> {
  await delay(200);
  const student = findByUser(studentId);
  if (!student) return [];
  return dbQuizzes
    .filter((q) => !student.className || q.className === student.className)
    .map((quiz) => {
      const attempt = dbQuizAttempts.find(
        (a) => a.quizId === quiz.id && a.studentId === studentId
      );
      return {
        ...toQuizRecord(quiz),
        attempt: attempt ? { ...attempt } : null,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function submitQuiz(
  quizId: string,
  studentId: string,
  answers: Record<string, string>
): Promise<QuizAttempt> {
  await delay();
  const quiz = dbQuizzes.find((q) => q.id === quizId);
  if (!quiz) throw new Error("Quiz tidak ditemukan");
  const existing = dbQuizAttempts.find(
    (a) => a.quizId === quizId && a.studentId === studentId
  );
  if (existing) throw new Error("Kamu sudah mengerjakan quiz ini");

  let score = 0;
  const maxScore = quiz.questions.reduce((sum, question) => sum + question.points, 0);
  for (const question of quiz.questions) {
    const answer = answers[question.id]?.trim() ?? "";
    if (question.type === "essay") {
      score += answer.length >= 10 ? Math.round(question.points * 0.85) : Math.round(question.points * 0.5);
    } else if (answer.toLowerCase() === question.correctAnswer.toLowerCase()) {
      score += question.points;
    }
  }
  const now = new Date().toISOString();
  const attempt: QuizAttempt = {
    id: nextId("qa-", dbQuizAttempts.map((a) => a.id)),
    quizId,
    studentId,
    answers,
    score,
    maxScore,
    startedAt: now,
    submittedAt: now,
  };
  dbQuizAttempts.push(attempt);
  return { ...attempt };
}

export async function getQuizAttempts(
  quizId?: string
): Promise<QuizAttemptRecord[]> {
  await delay();
  const list = quizId
    ? dbQuizAttempts.filter((a) => a.quizId === quizId)
    : dbQuizAttempts;
  return [...list]
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .map((attempt) => {
      const quiz = dbQuizzes.find((q) => q.id === attempt.quizId);
      const student = findByUser(attempt.studentId);
      const percentage =
        attempt.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0;
      return {
        ...attempt,
        quizTitle: quiz?.title ?? "Quiz telah dihapus",
        quizSubject: quiz ? (dbSubjects.find((s) => s.id === quiz.subjectId)?.name ?? "-") : "-",
        studentName: student?.name ?? "Siswa telah dihapus",
        percentage,
      };
    });
}

/* ===================== Rubrik ===================== */

export interface CreateRubricInput {
  title: string;
  description?: string;
  criteria: { label: string; maxScore: number }[];
}

export async function getRubrics(): Promise<Rubric[]> {
  await delay();
  return dbRubrics.map((r) => ({ ...r, criteria: r.criteria.map((c) => ({ ...c })) }));
}

export async function createRubric(input: CreateRubricInput): Promise<Rubric> {
  await delay();
  const rubric: Rubric = {
    id: nextId("rb-", dbRubrics.map((r) => r.id)),
    title: input.title,
    description: input.description,
    criteria: input.criteria.map((c) => ({ id: `c-${Math.random().toString(36).slice(2, 8)}`, ...c })),
    createdAt: new Date().toISOString(),
  };
  dbRubrics.push(rubric);
  return { ...rubric, criteria: rubric.criteria.map((c) => ({ ...c })) };
}

export async function updateRubric(
  id: string,
  patch: Partial<Omit<Rubric, "id" | "createdAt">>
): Promise<Rubric> {
  await delay();
  const index = dbRubrics.findIndex((r) => r.id === id);
  if (index === -1) throw new Error("Rubrik tidak ditemukan");
  dbRubrics[index] = { ...dbRubrics[index], ...patch, id };
  return { ...dbRubrics[index], criteria: dbRubrics[index].criteria.map((c) => ({ ...c })) };
}

export async function deleteRubric(id: string): Promise<void> {
  await delay();
  const index = dbRubrics.findIndex((r) => r.id === id);
  if (index !== -1) dbRubrics.splice(index, 1);
}

/* ===================== Materi Pembelajaran ===================== */

export interface CreateMaterialInput {
  title: string;
  description?: string;
  subjectId: string;
  teacherId: string;
  type: MaterialType;
  fileName?: string;
  url?: string;
  sizeKb?: number;
}

const MATERIAL_META: Record<MaterialType, { label: string; color: string }> = {
  pdf: { label: "PDF", color: "#ef4444" },
  ppt: { label: "PPT", color: "#f97316" },
  doc: { label: "DOC", color: "#0ea5e9" },
  video: { label: "Video", color: "#8b5cf6" },
  link: { label: "Link", color: "#10b981" },
};

export { MATERIAL_META, QUESTION_TYPE_LABELS };

function toMaterialRecord(material: Material): MaterialRecord {
  const subject = dbSubjects.find((s) => s.id === material.subjectId);
  const teacher = findByUser(material.teacherId);
  return {
    ...material,
    subjectName: subject?.name ?? "Mata pelajaran telah dihapus",
    teacherName: teacher?.name ?? "Guru telah dihapus",
    color: subject?.color ?? "#64748b",
  };
}

export async function getMaterials(
  subjectId?: string
): Promise<MaterialRecord[]> {
  await delay();
  const list = subjectId
    ? dbMaterials.filter((m) => m.subjectId === subjectId)
    : dbMaterials;
  return [...list]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toMaterialRecord);
}

export async function createMaterial(
  input: CreateMaterialInput
): Promise<MaterialRecord> {
  await delay();
  const material: Material = {
    id: nextId("mt-", dbMaterials.map((m) => m.id)),
    ...input,
    createdAt: new Date().toISOString(),
  };
  dbMaterials.push(material);
  return toMaterialRecord(material);
}

export async function updateMaterial(
  id: string,
  patch: Partial<Omit<Material, "id" | "createdAt">>
): Promise<MaterialRecord> {
  await delay();
  const index = dbMaterials.findIndex((m) => m.id === id);
  if (index === -1) throw new Error("Materi tidak ditemukan");
  dbMaterials[index] = { ...dbMaterials[index], ...patch, id };
  return toMaterialRecord(dbMaterials[index]);
}

export async function deleteMaterial(id: string): Promise<void> {
  await delay();
  const index = dbMaterials.findIndex((m) => m.id === id);
  if (index !== -1) dbMaterials.splice(index, 1);
}

/* ===================== Forum Diskusi ===================== */

function toThreadRecord(thread: ForumThread): ForumThreadRecord {
  const assignment = dbAssignments.find((a) => a.id === thread.assignmentId);
  const posts = dbForumPosts.filter((p) => p.threadId === thread.id);
  return {
    ...thread,
    assignmentTitle: assignment?.title ?? "Tugas telah dihapus",
    postCount: posts.length,
    lastPostAt: posts
      .map((p) => p.createdAt)
      .sort()
      .reverse()[0],
  };
}

export async function getForumThreads(): Promise<ForumThreadRecord[]> {
  await delay();
  return [...dbForumThreads]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toThreadRecord);
}

export async function getForumThreadsByAssignment(
  assignmentId: string
): Promise<ForumThreadRecord[]> {
  await delay(150);
  return dbForumThreads
    .filter((t) => t.assignmentId === assignmentId)
    .map(toThreadRecord);
}

export async function getForumPosts(threadId: string): Promise<ForumPost[]> {
  await delay(150);
  return dbForumPosts
    .filter((p) => p.threadId === threadId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((p) => ({ ...p }));
}

export async function createForumThread(input: {
  assignmentId: string;
  title: string;
  authorId: string;
  authorName: string;
}): Promise<ForumThreadRecord> {
  await delay();
  const thread: ForumThread = {
    id: nextId("th-", dbForumThreads.map((t) => t.id)),
    ...input,
    createdAt: new Date().toISOString(),
  };
  dbForumThreads.push(thread);
  return toThreadRecord(thread);
}

export async function createForumPost(input: {
  threadId: string;
  authorId: string;
  authorName: string;
  content: string;
}): Promise<ForumPost> {
  await delay();
  if (!input.content.trim()) throw new Error("Isi pesan tidak boleh kosong");
  const post: ForumPost = {
    id: nextId("fp-", dbForumPosts.map((p) => p.id)),
    ...input,
    content: input.content.trim(),
    createdAt: new Date().toISOString(),
  };
  dbForumPosts.push(post);
  return { ...post };
}

export async function deleteForumThread(id: string): Promise<void> {
  await delay();
  const index = dbForumThreads.findIndex((t) => t.id === id);
  if (index !== -1) dbForumThreads.splice(index, 1);
  for (let i = dbForumPosts.length - 1; i >= 0; i--) {
    if (dbForumPosts[i].threadId === id) dbForumPosts.splice(i, 1);
  }
}

export { dbUsers };
