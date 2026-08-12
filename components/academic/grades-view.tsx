"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BarChart3, BookOpen, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-screen";
import { ExportButton } from "@/components/shared/export-button";
import { StatCard } from "@/components/shared/stat-card";
import { CircularProgress } from "@/components/shared/circular-progress";
import { LineChart } from "@/components/shared/line-chart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { KKM, gradePredicateLabel, isPassed } from "@/lib/academics";
import { formatDate } from "@/lib/format";
import {
  createGrade,
  deleteGrade,
  getGradebookByClass,
  getGrades,
  getStudentGradeSummary,
  updateGrade,
  type GradebookRow,
} from "@/services/academic-service";
import { getSubjects } from "@/services/academic-service";
import { getStudents } from "@/services/user-service";
import type {
  AppUser,
  GradeRecord,
  GradeType,
  StudentGradeSummary,
  SubjectRecord,
} from "@/types";

const GRADE_TYPES: GradeType[] = ["tugas", "uts", "uas", "quiz"];

const GRADE_TYPE_LABELS: Record<GradeType, string> = {
  tugas: "Tugas",
  uts: "UTS",
  uas: "UAS",
  quiz: "Quiz",
};

interface GradeForm {
  studentId: string;
  subjectId: string;
  teacherId: string;
  type: GradeType;
  score: string;
  comment: string;
}

const EMPTY_FORM: GradeForm = {
  studentId: "",
  subjectId: "",
  teacherId: "",
  type: "tugas",
  score: "",
  comment: "",
};

export function GradesView() {
  const { user } = useAuth();
  const isStudent = user?.role === "student";

  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [students, setStudents] = useState<AppUser[]>([]);
  const [gradebook, setGradebook] = useState<GradebookRow[] | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>(CLASS_OPTIONS[0]);
  const [selectedSubject, setSelectedSubject] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GradeRecord | null>(null);
  const [form, setForm] = useState<GradeForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GradeRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [summary, setSummary] = useState<StudentGradeSummary | null>(null);
  const [recentGrades, setRecentGrades] = useState<GradeRecord[] | null>(null);

  const loadBase = useCallback(async () => {
    const [subjectList, studentList] = await Promise.all([
      getSubjects(),
      getStudents(),
    ]);
    setSubjects(subjectList);
    setStudents(studentList);
  }, []);

  useEffect(() => {
    void loadBase();
  }, [loadBase]);

  useEffect(() => {
    if (!isStudent) return;
    if (!user) return;
    const uid = user.uid;
    let active = true;
    async function load() {
      const [studentSummary, grades] = await Promise.all([
        getStudentGradeSummary(uid),
        getGrades({ studentId: uid }),
      ]);
      if (!active) return;
      setSummary(studentSummary);
      setRecentGrades(grades);
    }
    void load();
    return () => {
      active = false;
    };
  }, [isStudent, user]);

  const loadGradebook = useCallback(async () => {
    const rows = await getGradebookByClass(selectedClass);
    setGradebook(rows);
  }, [selectedClass]);

  useEffect(() => {
    if (isStudent) return;
    setGradebook(null);
    void loadGradebook();
  }, [loadGradebook, isStudent]);

  function openCreate() {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      studentId: students.find((s) => s.className === selectedClass)?.uid ?? "",
      subjectId: subjects[0]?.id ?? "",
      teacherId: subjects[0]?.teacherId ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.studentId || !form.subjectId) {
      toast.error("Pilih siswa dan mata pelajaran");
      return;
    }
    const score = Number(form.score);
    if (Number.isNaN(score) || score < 0 || score > 100) {
      toast.error("Nilai harus angka 0–100");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateGrade(editing.id, {
          score,
          comment: form.comment.trim() || undefined,
          type: form.type,
        });
        toast.success("Nilai diperbarui");
      } else {
        await createGrade({
          studentId: form.studentId,
          subjectId: form.subjectId,
          teacherId: form.teacherId,
          type: form.type,
          score,
          comment: form.comment.trim() || undefined,
        });
        toast.success("Nilai ditambahkan");
      }
      setDialogOpen(false);
      await Promise.all([loadGradebook()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan nilai");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteGrade(deleteTarget.id);
      toast.success("Nilai dihapus");
      await loadGradebook();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus nilai");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  const chartData = useMemo(() => {
    if (!summary) return [];
    const points: { label: string; value: number }[] = [];
    for (const group of summary.perSubject) {
      points.push({
        label: group.subjectName.split(" ")[0],
        value: group.average,
      });
    }
    return points;
  }, [summary]);

  if (isStudent) {
    if (!summary || !recentGrades) return <PageLoader />;
    return (
      <div className="space-y-6">
        <PageHeader
          title="Nilai Saya"
          description="Rekap nilai dari semua mata pelajaran."
          actions={
            <ExportButton
              filename={`nilai-saya-${user?.name ?? ""}`}
              title="Rekap Nilai"
              disabled={summary.perSubject.length === 0}
              columns={[
                { header: "Mata Pelajaran", value: "Mata Pelajaran" },
                { header: "Rata-rata", value: "Rata-rata" },
                { header: "Predikat", value: "Predikat" },
                { header: "Komponen", value: "Komponen" },
              ]}
              rows={summary.perSubject.map((group) => [
                group.subjectName,
                String(group.average),
                gradePredicateLabel(group.predicate),
                String(group.scores.length),
              ])}
            />
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="gap-0 py-0">
            <CardContent className="flex items-center justify-between px-5 py-5">
              <div>
                <p className="text-muted-foreground text-sm">Rata-rata</p>
                <p className="text-2xl font-semibold">{summary.average}</p>
                <p className="text-muted-foreground text-xs">
                  Predikat {summary.predicate}
                </p>
              </div>
              <CircularProgress
                value={summary.average}
                size={64}
                color={isPassed(summary.average) ? "var(--color-chart-2)" : "var(--color-chart-5)"}
                label={String(summary.average)}
              />
            </CardContent>
          </Card>
          <StatCard
            label="Total Nilai"
            value={summary.totalGrades}
            change="Semua komponen"
            trend="flat"
            icon={BarChart3}
          />
          <StatCard
            label="Mata Pelajaran"
            value={summary.perSubject.length}
            change="Terisi"
            trend="flat"
            icon={BookOpen}
          />
          <Card
            className={
              summary.status === "lulus" ? "gap-0 border-success/30 bg-success/5 py-0" : "gap-0 border-destructive/30 bg-destructive/5 py-0"
            }
          >
            <CardContent className="px-5 py-5">
              <p className="text-muted-foreground text-sm">Status KKM ({KKM})</p>
              <p
                className={
                  summary.status === "lulus"
                    ? "text-success text-2xl font-semibold"
                    : "text-destructive text-2xl font-semibold"
                }
              >
                {summary.status === "lulus" ? "Tuntas" : "Belum Tuntas"}
              </p>
              <p className="text-muted-foreground text-xs">
                Berdasarkan rata-rata nilai
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">Grafik Rata-rata per Mapel</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <LineChart data={chartData} />
              ) : (
                <EmptyState
                  icon={BarChart3}
                  title="Belum ada nilai"
                  description="Nilai akan muncul setelah guru menginput."
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Nilai Terbaru</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentGrades.length === 0 ? (
                <p className="text-muted-foreground text-sm">Belum ada nilai.</p>
              ) : (
                recentGrades.slice(0, 8).map((grade) => (
                  <div
                    key={grade.id}
                    className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {grade.subjectName}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {GRADE_TYPE_LABELS[grade.type]} · {formatDate(grade.gradedAt)}
                      </p>
                    </div>
                    <Badge
                      variant={isPassed(grade.score) ? "successSoft" : "dangerSoft"}
                      className="min-w-10 justify-center"
                    >
                      {grade.score}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {summary.perSubject.map((group) => (
            <Card key={group.subjectId}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{group.subjectName}</p>
                    <p className="text-muted-foreground text-xs">
                      {group.scores.length} komponen ·{" "}
                      {gradePredicateLabel(group.predicate)}
                    </p>
                  </div>
                  <Badge
                    variant={isPassed(group.average) ? "successSoft" : "dangerSoft"}
                    className="min-w-10 justify-center"
                  >
                    {group.average}
                  </Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {group.scores.map((score) => (
                    <Badge key={score.id} variant="outline" className="gap-1">
                      {GRADE_TYPE_LABELS[score.type]}
                      <span
                        className={
                          isPassed(score.score) ? "text-success" : "text-destructive"
                        }
                      >
                        {score.score}
                      </span>
                    </Badge>
                  ))}
                </div>
                <div className="mt-4">
                  <CircularProgress value={group.average} size={56} color={group.color} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!gradebook) return <PageLoader />;

  const visibleRows = gradebook.filter((row) =>
    selectedSubject === "all"
      ? true
      : row.subjects.some((s) => s.subjectId === selectedSubject)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nilai"
        description="Input dan kelola nilai siswa per kelas."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ExportButton
              filename={`nilai-${selectedClass}`}
              title={`Rekap Nilai ${selectedClass}`}
              disabled={visibleRows.length === 0}
              columns={[
                { header: "Rank", value: "Rank" },
                { header: "Siswa", value: "Siswa" },
                { header: "NIS", value: "NIS" },
                ...(selectedSubject === "all"
                  ? subjects
                  : subjects.filter((s) => s.id === selectedSubject)
                ).map((subject) => ({
                  header: subject.name,
                  value: subject.name,
                })),
                { header: "Rata-rata", value: "Rata-rata" },
              ]}
              rows={visibleRows.map((row, index) => [
                String(index + 1),
                row.studentName,
                row.nis ?? "-",
                ...(selectedSubject === "all"
                  ? subjects
                  : subjects.filter((s) => s.id === selectedSubject)
                ).map((subject) => {
                  const found = row.subjects.find(
                    (s) => s.subjectId === subject.id
                  );
                  return found ? String(found.average) : "-";
                }),
                String(row.overallAverage),
              ])}
            />
            <Select
              value={selectedClass}
              onValueChange={setSelectedClass}
            >
              <SelectTrigger className="w-40">
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
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
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
              Input Nilai
            </Button>
          </div>
        }
      />

      <Card className="gap-0 py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Siswa</TableHead>
                <TableHead>NIS</TableHead>
                {(selectedSubject === "all"
                  ? subjects
                  : subjects.filter((s) => s.id === selectedSubject)
                ).map((subject) => (
                  <TableHead key={subject.id} className="text-center">
                    <span
                      className="inline-flex items-center gap-1"
                      style={{ color: subject.color }}
                    >
                      <span
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: subject.color }}
                      />
                      {subject.name}
                    </span>
                  </TableHead>
                ))}
                <TableHead className="text-center">Rata-rata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((row, index) => {
                const rowSubjects =
                  selectedSubject === "all"
                    ? row.subjects
                    : row.subjects.filter((s) => s.subjectId === selectedSubject);
                return (
                  <TableRow key={row.studentId}>
                    <TableCell className="text-muted-foreground">
                      #{index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {row.studentName}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.nis ?? "-"}
                    </TableCell>
                    {rowSubjects.map((subject) => (
                      <TableCell key={subject.subjectId} className="text-center">
                        <Badge
                          variant={isPassed(subject.average) ? "successSoft" : "dangerSoft"}
                          className="min-w-8 justify-center"
                        >
                          {subject.average}
                        </Badge>
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-semibold">
                      {row.overallAverage}
                    </TableCell>
                  </TableRow>
                );
              })}
              {visibleRows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3 + (selectedSubject === "all" ? subjects.length : 1) + 1}
                    className="text-center"
                  >
                    <EmptyState
                      icon={BarChart3}
                      title="Belum ada nilai"
                      description="Input nilai untuk kelas ini."
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Nilai" : "Input Nilai"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Siswa</Label>
                <Select
                  value={form.studentId}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, studentId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih siswa" />
                  </SelectTrigger>
                  <SelectContent>
                    {students
                      .filter((s) => !selectedClass || s.className === selectedClass)
                      .map((student) => (
                        <SelectItem key={student.uid} value={student.uid}>
                          {student.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mata Pelajaran</Label>
                <Select
                  value={form.subjectId}
                  onValueChange={(value) => {
                    const subject = subjects.find((s) => s.id === value);
                    setForm((prev) => ({
                      ...prev,
                      subjectId: value,
                      teacherId: subject?.teacherId ?? prev.teacherId,
                    }));
                  }}
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Komponen</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, type: value as GradeType }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {GRADE_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nilai (0–100)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.score}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, score: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Komentar</Label>
              <Input
                value={form.comment}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, comment: e.target.value }))
                }
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
        title="Hapus nilai"
        description={`Hapus nilai ${deleteTarget?.score ?? ""} untuk ${deleteTarget?.studentName ?? ""}?`}
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
