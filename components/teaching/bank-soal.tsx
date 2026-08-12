"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FileQuestion, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { DIFFICULTY_LABELS, QUESTION_TYPE_LABELS } from "@/lib/academics";
import { cn } from "@/lib/utils";
import {
  createBankQuestion,
  deleteBankQuestion,
  getBankQuestions,
  updateBankQuestion,
} from "@/services/teacher-content-service";
import { getSubjects } from "@/services/academic-service";
import type {
  BankQuestionRecord,
  QuestionDifficulty,
  QuestionType,
  SubjectRecord,
} from "@/types";

const QUESTION_TYPES: QuestionType[] = ["multiple_choice", "essay", "true_false"];
const DIFFICULTIES: QuestionDifficulty[] = ["mudah", "sedang", "sulit"];

const DIFFICULTY_BADGE: Record<QuestionDifficulty, string> = {
  mudah: "successSoft",
  sedang: "warningSoft",
  sulit: "dangerSoft",
};

interface QuestionForm {
  type: QuestionType;
  subjectId: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: QuestionDifficulty;
  points: string;
}

const EMPTY_FORM: QuestionForm = {
  type: "multiple_choice",
  subjectId: "",
  text: "",
  options: ["", "", "", ""],
  correctAnswer: "",
  explanation: "",
  difficulty: "sedang",
  points: "10",
};

export function BankSoal() {
  const [questions, setQuestions] = useState<BankQuestionRecord[] | null>(null);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BankQuestionRecord | null>(null);
  const [form, setForm] = useState<QuestionForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BankQuestionRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const [questionList, subjectList] = await Promise.all([
      getBankQuestions(),
      getSubjects(),
    ]);
    setQuestions(questionList);
    setSubjects(subjectList);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, subjectId: subjects[0]?.id ?? "" });
    setDialogOpen(true);
  }

  function openEdit(question: BankQuestionRecord) {
    setEditing(question);
    setForm({
      type: question.type,
      subjectId: question.subjectId,
      text: question.text,
      options:
        question.options && question.options.length > 0
          ? question.options
          : ["", "", "", ""],
      correctAnswer: question.correctAnswer,
      explanation: question.explanation ?? "",
      difficulty: question.difficulty,
      points: String(question.points),
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.subjectId) {
      toast.error("Pilih mata pelajaran");
      return;
    }
    if (!form.text.trim()) {
      toast.error("Pertanyaan wajib diisi");
      return;
    }
    if (form.type !== "essay" && !form.correctAnswer.trim()) {
      toast.error("Jawaban benar wajib diisi");
      return;
    }
    const points = Number(form.points);
    if (Number.isNaN(points) || points <= 0) {
      toast.error("Poin harus angka positif");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        type: form.type,
        subjectId: form.subjectId,
        text: form.text.trim(),
        options:
          form.type === "multiple_choice"
            ? form.options.filter((option) => option.trim())
            : undefined,
        correctAnswer: form.correctAnswer.trim(),
        explanation: form.explanation.trim() || undefined,
        difficulty: form.difficulty,
        points,
      };
      if (editing) {
        await updateBankQuestion(editing.id, payload);
        toast.success("Soal diperbarui");
      } else {
        await createBankQuestion(payload);
        toast.success("Soal ditambahkan");
      }
      setDialogOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan soal");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBankQuestion(deleteTarget.id);
      toast.success("Soal dihapus");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus soal");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  const filtered = (questions ?? []).filter(
    (question) => subjectFilter === "all" || question.subjectId === subjectFilter
  );

  if (!questions) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bank Soal"
        description="Kelola kumpulan soal untuk quiz dan ujian."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Semua mapel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua mapel</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Tambah Soal
            </Button>
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileQuestion}
          title="Belum ada soal"
          description="Tambahkan soal ke bank soal."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((question) => (
            <Card key={question.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{QUESTION_TYPE_LABELS[question.type]}</Badge>
                      <Badge
                        variant={DIFFICULTY_BADGE[question.difficulty] as "successSoft" | "warningSoft" | "dangerSoft"}
                      >
                        {DIFFICULTY_LABELS[question.difficulty]}
                      </Badge>
                      <Badge variant="outline">{question.points} poin</Badge>
                      <Badge variant="outline">{question.subjectName}</Badge>
                    </div>
                    <p className="mt-2 text-sm font-medium">{question.text}</p>
                    {question.options && question.options.length > 0 && (
                      <div className="mt-2 grid gap-1 sm:grid-cols-2">
                        {question.options.map((option, index) => (
                          <div
                            key={index}
                            className={cn(
                              "rounded-md border px-2.5 py-1 text-xs",
                              option === question.correctAnswer
                                ? "border-success/40 bg-success/10 text-success"
                                : "text-muted-foreground"
                            )}
                          >
                            {String.fromCharCode(65 + index)}. {option}
                          </div>
                        ))}
                      </div>
                    )}
                    {question.type === "true_false" && (
                      <p className="text-success mt-2 text-xs">
                        Jawaban: {question.correctAnswer}
                      </p>
                    )}
                    {question.explanation && (
                      <p className="text-muted-foreground mt-2 text-xs">
                        💡 {question.explanation}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(question)}
                      aria-label="Edit"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => setDeleteTarget(question)}
                      aria-label="Hapus"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Soal" : "Tambah Soal"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipe Soal</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      type: value as QuestionType,
                      correctAnswer: "",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUESTION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {QUESTION_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <div className="space-y-2">
              <Label>Pertanyaan</Label>
              <Textarea
                value={form.text}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, text: e.target.value }))
                }
                rows={2}
              />
            </div>
            {form.type === "multiple_choice" && (
              <div className="space-y-2">
                <Label>Pilihan Jawaban</Label>
                <div className="grid gap-2">
                  {form.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-muted-foreground w-5 text-sm">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <Input
                        value={option}
                        onChange={(e) => {
                          const options = [...form.options];
                          options[index] = e.target.value;
                          setForm((prev) => ({ ...prev, options }));
                        }}
                        placeholder={`Pilihan ${String.fromCharCode(65 + index)}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>
                Jawaban Benar
                {form.type === "multiple_choice" && " (ketik salah satu pilihan)"}
              </Label>
              <Input
                value={form.correctAnswer}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, correctAnswer: e.target.value }))
                }
                placeholder={
                  form.type === "true_false" ? "Benar / Salah" : "Jawaban"
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tingkat Kesulitan</Label>
                <Select
                  value={form.difficulty}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      difficulty: value as QuestionDifficulty,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((difficulty) => (
                      <SelectItem key={difficulty} value={difficulty}>
                        {DIFFICULTY_LABELS[difficulty]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Poin</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.points}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, points: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Pembahasan</Label>
              <Textarea
                value={form.explanation}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, explanation: e.target.value }))
                }
                rows={2}
                placeholder="Opsional"
              />
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
              {saving ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Hapus soal"
        description="Soal akan dihapus dari bank soal."
        onOpenChange={(open) => {
          if (!deleting) setDeleteTarget(open ? deleteTarget : null);
        }}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
