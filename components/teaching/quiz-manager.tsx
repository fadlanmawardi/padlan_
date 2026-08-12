"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ClipboardCheck,
  Clock,
  FileQuestion,
  Pencil,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { CLASS_OPTIONS } from "@/lib/constants";
import { QUESTION_TYPE_LABELS } from "@/lib/academics";
import { formatDate, daysUntil } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  createQuiz,
  deleteQuiz,
  getQuizAttempts,
  getQuizStudentViews,
  getQuizzes,
  submitQuiz,
  updateQuiz,
} from "@/services/teacher-content-service";
import { getSubjects } from "@/services/academic-service";
import type {
  QuestionType,
  QuizQuestion,
  QuizRecord,
  QuizStudentView,
  QuizAttemptRecord,
  SubjectRecord,
} from "@/types";

interface QuizDraftQuestion {
  type: QuestionType;
  text: string;
  options: string[];
  correctAnswer: string;
  points: string;
}

interface QuizForm {
  title: string;
  description: string;
  subjectId: string;
  className: string;
  timeLimitMinutes: string;
  dueAt: string;
  questions: QuizDraftQuestion[];
}

const EMPTY_QUESTION: QuizDraftQuestion = {
  type: "multiple_choice",
  text: "",
  options: ["", "", "", ""],
  correctAnswer: "",
  points: "10",
};

function emptyQuizForm(): QuizForm {
  return {
    title: "",
    description: "",
    subjectId: "",
    className: CLASS_OPTIONS[0],
    timeLimitMinutes: "15",
    dueAt: "",
    questions: [structuredClone(EMPTY_QUESTION)],
  };
}

export function QuizManager() {
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  const [studentQuizzes, setStudentQuizzes] = useState<QuizStudentView[] | null>(
    null
  );
  const [quizzes, setQuizzes] = useState<QuizRecord[] | null>(null);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<QuizRecord | null>(null);
  const [form, setForm] = useState<QuizForm>(emptyQuizForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<QuizRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [attemptsFor, setAttemptsFor] = useState<QuizRecord | null>(null);
  const [attempts, setAttempts] = useState<QuizAttemptRecord[]>([]);
  const [taking, setTaking] = useState<QuizRecord | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<QuizStudentView | null>(null);

  const loadBase = useCallback(async () => {
    const subjectList = await getSubjects();
    setSubjects(subjectList);
  }, []);

  useEffect(() => {
    void loadBase();
  }, [loadBase]);

  const loadStudent = useCallback(async () => {
    if (!user) return;
    const list = await getQuizStudentViews(user.uid);
    setStudentQuizzes(list);
  }, [user]);

  const loadAdmin = useCallback(async () => {
    const list = await getQuizzes();
    setQuizzes(list);
  }, []);

  useEffect(() => {
    if (isStudent) {
      setQuizzes(null);
      void loadStudent();
    } else {
      setStudentQuizzes(null);
      void loadAdmin();
    }
  }, [isStudent, loadAdmin, loadStudent]);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyQuizForm(), subjectId: subjects[0]?.id ?? "" });
    setDialogOpen(true);
  }

  function openEdit(quiz: QuizRecord) {
    setEditing(quiz);
    setForm({
      title: quiz.title,
      description: quiz.description ?? "",
      subjectId: quiz.subjectId,
      className: quiz.className,
      timeLimitMinutes: String(quiz.timeLimitMinutes),
      dueAt: quiz.dueAt ?? "",
      questions: quiz.questions.map((question) => ({
        type: question.type,
        text: question.text,
        options: question.options ?? [],
        correctAnswer: question.correctAnswer,
        points: String(question.points),
      })),
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error("Judul quiz wajib diisi");
      return;
    }
    if (!form.subjectId) {
      toast.error("Pilih mata pelajaran");
      return;
    }
    const validQuestions = form.questions.filter((q) => q.text.trim());
    if (validQuestions.length === 0) {
      toast.error("Tambahkan minimal satu pertanyaan");
      return;
    }
    const timeLimit = Number(form.timeLimitMinutes);
    if (Number.isNaN(timeLimit) || timeLimit <= 0) {
      toast.error("Durasi harus angka positif");
      return;
    }
    setSaving(true);
    try {
      const questions: QuizQuestion[] = validQuestions.map((question) => ({
        id: `q-${Math.random().toString(36).slice(2, 8)}`,
        type: question.type,
        text: question.text.trim(),
        options:
          question.type === "multiple_choice"
            ? question.options.filter((option) => option.trim())
            : undefined,
        correctAnswer: question.correctAnswer.trim(),
        points: Math.max(1, Number(question.points) || 10),
      }));
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        subjectId: form.subjectId,
        className: form.className,
        timeLimitMinutes: timeLimit,
        dueAt: form.dueAt || undefined,
        questions,
      };
      if (editing) {
        await updateQuiz(editing.id, payload);
        toast.success("Quiz diperbarui");
      } else {
        await createQuiz({ ...payload, teacherId: user?.uid ?? "" });
        toast.success("Quiz dibuat");
      }
      setDialogOpen(false);
      await loadAdmin();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan quiz");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteQuiz(deleteTarget.id);
      toast.success("Quiz dihapus");
      await loadAdmin();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus quiz");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  async function openAttempts(quiz: QuizRecord) {
    const list = await getQuizAttempts(quiz.id);
    setAttempts(list);
    setAttemptsFor(quiz);
  }

  function startQuiz(quiz: QuizStudentView) {
    setActiveQuiz(quiz);
    setTaking(quiz);
  }

  if (isStudent) {
    if (!studentQuizzes) return <PageLoader />;
    return (
      <div className="space-y-6">
        <PageHeader
          title="Quiz Online"
          description="Kerjakan quiz dari guru dan lihat hasilnya."
        />
        {taking && activeQuiz ? (
          <QuizTaker
            quiz={activeQuiz}
            onDone={async (attempt) => {
              await loadStudent();
              setTaking(null);
              setActiveQuiz(null);
              toast.success(`Quiz selesai! Skor kamu ${attempt.score}/${attempt.maxScore}`);
            }}
            onCancel={() => {
              setTaking(null);
              setActiveQuiz(null);
            }}
          />
        ) : studentQuizzes.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="Belum ada quiz"
            description="Quiz untuk kelas kamu belum tersedia."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {studentQuizzes.map((quiz) => {
              const done = quiz.attempt !== null && quiz.attempt !== undefined;
              const percentage = done
                ? Math.round(((quiz.attempt!.score) / (quiz.attempt!.maxScore || 1)) * 100)
                : 0;
              const days = quiz.dueAt ? daysUntil(quiz.dueAt) : null;
              return (
                <Card key={quiz.id} className="gap-0 py-0">
                  <CardHeader>
                    <CardTitle className="line-clamp-2 text-base">
                      {quiz.title}
                    </CardTitle>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline">{quiz.subjectName}</Badge>
                      <Badge variant="outline">{quiz.className}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <FileQuestion className="size-4" />
                        {quiz.questionCount} soal
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-4" />
                        {quiz.timeLimitMinutes} menit
                      </span>
                    </div>
                    {quiz.dueAt && (
                      <Badge
                        variant={
                          days !== null && days < 0
                            ? "secondary"
                            : days !== null && days <= 2
                              ? "warningSoft"
                              : "infoSoft"
                        }
                      >
                        {days !== null && days < 0
                          ? "Batas waktu lewat"
                          : days === 0
                            ? "Berakhir hari ini"
                            : `Batas: ${formatDate(quiz.dueAt)}`}
                      </Badge>
                    )}
                    {done ? (
                      <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
                        <span className="text-sm">Hasil kamu</span>
                        <Badge
                          variant={percentage >= 75 ? "success" : "warning"}
                          className="text-xs"
                        >
                          {percentage}%
                        </Badge>
                      </div>
                    ) : (
                      <Button className="w-full" onClick={() => startQuiz(quiz)}>
                        <Play className="size-4" />
                        Kerjakan Quiz
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (!quizzes) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quiz Online"
        description="Buat dan kelola quiz untuk siswa."
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Buat Quiz
          </Button>
        }
      />

      {quizzes.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Belum ada quiz"
          description="Buat quiz pertama kamu."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="gap-0 py-0">
              <CardHeader>
                <CardTitle className="line-clamp-2 text-base">
                  {quiz.title}
                </CardTitle>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline">{quiz.subjectName}</Badge>
                  <Badge variant="outline">{quiz.className}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <FileQuestion className="size-4" />
                    {quiz.questionCount} soal
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-4" />
                    {quiz.timeLimitMinutes} menit
                  </span>
                </div>
                <p className="text-muted-foreground line-clamp-2 text-xs">
                  {quiz.description || "Tanpa deskripsi"} · oleh {quiz.teacherName}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => void openAttempts(quiz)}
                  >
                    Lihat Hasil
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(quiz)}
                    aria-label="Edit"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => setDeleteTarget(quiz)}
                    aria-label="Hapus"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setForm(emptyQuizForm());
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Quiz" : "Buat Quiz"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Judul</Label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Misal: Quiz Trigonometri"
                />
              </div>
              <div className="space-y-2">
                <Label>Mata Pelajaran</Label>
                <Select
                  value={form.subjectId}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, subjectId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih mapel" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Kelas</Label>
                <Select
                  value={form.className}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, className: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_OPTIONS.map((className) => (
                      <SelectItem key={className} value={className}>
                        {className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Durasi (menit)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.timeLimitMinutes}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      timeLimitMinutes: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Batas Waktu</Label>
                <Input
                  type="datetime-local"
                  value={form.dueAt}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, dueAt: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Opsional"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Pertanyaan</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      questions: [
                        ...prev.questions,
                        structuredClone(EMPTY_QUESTION),
                      ],
                    }))
                  }
                >
                  <Plus className="size-4" />
                  Tambah Soal
                </Button>
              </div>
              {form.questions.map((question, index) => (
                <div
                  key={index}
                  className="space-y-2 rounded-lg border p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">Soal {index + 1}</span>
                    <div className="flex items-center gap-2">
                      <Select
                        value={question.type}
                        onValueChange={(value) => {
                          const questions = [...form.questions];
                          questions[index] = {
                            ...questions[index],
                            type: value as QuestionType,
                            correctAnswer: "",
                          };
                          setForm((prev) => ({ ...prev, questions }));
                        }}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(["multiple_choice", "essay", "true_false"] as QuestionType[]).map(
                            (type) => (
                              <SelectItem key={type} value={type}>
                                {QUESTION_TYPE_LABELS[type]}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min={1}
                        value={question.points}
                        onChange={(e) => {
                          const questions = [...form.questions];
                          questions[index].points = e.target.value;
                          setForm((prev) => ({ ...prev, questions }));
                        }}
                        className="w-20"
                        placeholder="Poin"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            questions: prev.questions.filter(
                              (_, qIndex) => qIndex !== index
                            ),
                          }))
                        }
                        disabled={form.questions.length === 1}
                        aria-label="Hapus soal"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={question.text}
                    onChange={(e) => {
                      const questions = [...form.questions];
                      questions[index].text = e.target.value;
                      setForm((prev) => ({ ...prev, questions }));
                    }}
                    rows={2}
                    placeholder="Tulis pertanyaan…"
                  />
                  {question.type === "multiple_choice" && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {question.options.map((option, optionIndex) => (
                        <Input
                          key={optionIndex}
                          value={option}
                          onChange={(e) => {
                            const questions = [...form.questions];
                            questions[index].options[optionIndex] = e.target.value;
                            setForm((prev) => ({ ...prev, questions }));
                          }}
                          placeholder={`Pilihan ${String.fromCharCode(65 + optionIndex)}`}
                        />
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Jawaban Benar</Label>
                      <Input
                        value={question.correctAnswer}
                        onChange={(e) => {
                          const questions = [...form.questions];
                          questions[index].correctAnswer = e.target.value;
                          setForm((prev) => ({ ...prev, questions }));
                        }}
                        placeholder={
                          question.type === "true_false" ? "Benar / Salah" : "Jawaban"
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan Quiz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={attemptsFor !== null}
        onOpenChange={(open) => {
          if (!open) setAttemptsFor(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hasil Quiz: {attemptsFor?.title ?? ""}</DialogTitle>
          </DialogHeader>
          {attempts.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Belum ada siswa yang mengerjakan quiz ini.
            </p>
          ) : (
            <div className="space-y-2">
              {attempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{attempt.studentName}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatDate(attempt.submittedAt)}
                    </p>
                  </div>
                  <Badge
                    variant={attempt.percentage >= 75 ? "success" : "warning"}
                  >
                    {attempt.percentage}%
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Hapus quiz"
        description={`Hapus "${deleteTarget?.title ?? ""}" beserta semua hasil pengerjaannya?`}
        confirmLabel="Hapus"
        loading={deleting}
        onOpenChange={(open) => {
          if (!deleting) setDeleteTarget(open ? deleteTarget : null);
        }}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}

function QuizTaker({
  quiz,
  onDone,
  onCancel,
}: {
  quiz: QuizStudentView;
  onDone: (attempt: { score: number; maxScore: number }) => void;
  onCancel: () => void;
}) {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const answerFor = (question: QuizQuestion) =>
    answers[question.id] ?? "";

  async function handleSubmit() {
    if (!user) return;
    setSubmitting(true);
    try {
      const attempt = await submitQuiz(quiz.id, user.uid, answers);
      onDone(attempt);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengumpulkan");
      setSubmitting(false);
    }
  }

  const answeredCount = useMemo(
    () => quiz.questions.filter((q) => answerFor(q).trim()).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [answers, quiz]
  );

  return (
    <div className="space-y-4">
      <Card className="gap-0 py-0">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h3 className="font-semibold">{quiz.title}</h3>
            <p className="text-muted-foreground text-sm">
              {quiz.subjectName} · {quiz.questionCount} soal ·{" "}
              {quiz.timeLimitMinutes} menit
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="infoSoft">
              {answeredCount}/{quiz.questions.length} terjawab
            </Badge>
            <Button variant="outline" onClick={onCancel}>
              Keluar
            </Button>
          </div>
        </CardContent>
      </Card>

      {quiz.questions.map((question, index) => (
        <Card key={question.id}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                  {index + 1}
                </span>
                <p className="pt-0.5 text-sm font-medium">{question.text}</p>
              </div>
              <Badge variant="outline" className="shrink-0">
                {question.points} poin
              </Badge>
            </div>
            <div className="mt-4 space-y-2">
              {question.type === "multiple_choice" &&
                (question.options ?? []).map((option) => (
                  <label
                    key={option}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors",
                      answerFor(question) === option
                        ? "border-primary bg-primary/10"
                        : "hover:bg-muted"
                    )}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      className="sr-only"
                      checked={answerFor(question) === option}
                      onChange={() =>
                        setAnswers((prev) => ({ ...prev, [question.id]: option }))
                      }
                    />
                    <span className="text-muted-foreground">
                      {String.fromCharCode(65 + (question.options?.indexOf(option) ?? 0))}.
                    </span>
                    {option}
                  </label>
                ))}
              {question.type === "true_false" && (
                <div className="grid grid-cols-2 gap-2">
                  {["Benar", "Salah"].map((option) => (
                    <label
                      key={option}
                      className={cn(
                        "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm transition-colors",
                        answerFor(question) === option
                          ? "border-primary bg-primary/10"
                          : "hover:bg-muted"
                      )}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        className="sr-only"
                        checked={answerFor(question) === option}
                        onChange={() =>
                          setAnswers((prev) => ({ ...prev, [question.id]: option }))
                        }
                      />
                      {option}
                    </label>
                  ))}
                </div>
              )}
              {question.type === "essay" && (
                <Textarea
                  value={answerFor(question)}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [question.id]: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Tulis jawabanmu di sini…"
                />
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button onClick={() => void handleSubmit()} disabled={submitting}>
          {submitting ? "Mengumpulkan…" : "Kumpulkan Jawaban"}
        </Button>
      </div>
    </div>
  );
}
