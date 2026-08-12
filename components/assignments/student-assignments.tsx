"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  Pencil,
  Send,
  Upload,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-screen";
import { burstConfetti } from "@/lib/confetti";
import {
  StudentTaskStateBadge,
  AssignmentStatusBadge,
} from "@/components/shared/status-badges";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTime, daysUntil } from "@/lib/format";
import {
  getStudentTaskViews,
  saveSubmission,
} from "@/services/assignment-service";
import type { StudentTaskView } from "@/types";

const PAGE_SIZE = 6;

export function StudentAssignments() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<StudentTaskView[] | null>(null);
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [dialogTarget, setDialogTarget] = useState<StudentTaskView | null>(null);
  const [fileName, setFileName] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState<"draft" | "submit" | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setTasks(await getStudentTaskViews(user.uid));
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!tasks) return [];
    const q = query.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchState = stateFilter === "all" || task.taskState === stateFilter;
      if (!q) return matchState;
      return (
        matchState &&
        (task.title.toLowerCase().includes(q) ||
          task.subject.toLowerCase().includes(q) ||
          task.teacherName.toLowerCase().includes(q))
      );
    });
  }, [tasks, query, stateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const stats = useMemo(() => {
    const list = tasks ?? [];
    return {
      total: list.length,
      submitted: list.filter((t) => t.taskState === "submitted").length,
      inProgress: list.filter((t) => t.taskState === "in_progress").length,
      late: list.filter((t) => t.taskState === "late").length,
    };
  }, [tasks]);

  function openDialog(task: StudentTaskView) {
    setDialogTarget(task);
    setFileName(task.submission?.fileName ?? "");
    setNotes(task.submission?.notes ?? "");
  }

  async function handleSave(submit: boolean) {
    if (!dialogTarget || !user) return;
    if (!fileName.trim()) {
      toast.error("Lampiran tugas wajib diisi");
      return;
    }
    setSaving(submit ? "submit" : "draft");
    try {
      await saveSubmission({
        assignmentId: dialogTarget.id,
        studentId: user.uid,
        fileName: fileName.trim(),
        notes: notes.trim() || undefined,
        submit,
      });
      toast.success(
        submit ? "Tugas berhasil dikumpulkan" : "Draft tugas disimpan"
      );
      if (submit) {
        burstConfetti({ count: 100 });
      }
      setDialogTarget(null);
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan tugas"
      );
    } finally {
      setSaving(null);
    }
  }

  if (!tasks) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tugas Saya"
        description="Kerjakan dan kumpulkan tugas dari guru."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Tugas"
          value={stats.total}
          change="Sepanjang waktu"
          trend="flat"
          icon={ClipboardList}
        />
        <StatCard
          label="Sudah Dikumpulkan"
          value={stats.submitted}
          change="Tepat waktu"
          trend="up"
          icon={CheckCircle2}
        />
        <StatCard
          label="Sedang Dikerjakan"
          value={stats.inProgress}
          change="Segera selesaikan"
          trend="flat"
          icon={Clock3}
        />
        <StatCard
          label="Terlambat / Belum"
          value={stats.late}
          change={stats.late > 0 ? "Perlu tindakan" : "Aman"}
          trend={stats.late > 0 ? "down" : "flat"}
          icon={CalendarClock}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Cari tugas, mapel, atau guru…"
          className="w-full sm:max-w-sm"
        />
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Semua status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua status</SelectItem>
            <SelectItem value="not_started">Belum dikerjakan</SelectItem>
            <SelectItem value="in_progress">Sedang dikerjakan</SelectItem>
            <SelectItem value="submitted">Sudah dikumpulkan</SelectItem>
            <SelectItem value="late">Terlambat</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={ClipboardList}
              title={query ? "Tidak ada hasil" : "Belum ada tugas"}
              description={
                query
                  ? `Tidak ditemukan tugas yang cocok dengan "${query}".`
                  : "Tugas dari guru akan tampil di sini."
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((task) => {
            const days = daysUntil(task.deadline);
            const canSubmit = task.status === "open";
            return (
              <Card key={task.id} className="gap-0 py-0">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base">{task.title}</CardTitle>
                    <AssignmentStatusBadge status={task.status} />
                  </div>
                  <CardDescription className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{task.subject}</Badge>
                    <span>· {task.teacherName}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {task.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-muted-foreground">
                      Deadline {formatDateTime(task.deadline)}
                    </span>
                    {task.status === "open" && (
                      <Badge
                        variant={
                          days < 0
                            ? "dangerSoft"
                            : days <= 1
                              ? "warningSoft"
                              : "infoSoft"
                        }
                      >
                        {days < 0
                          ? `Terlambat ${Math.abs(days)} hari`
                          : days === 0
                            ? "Hari ini"
                            : `Sisa ${days} hari`}
                      </Badge>
                    )}
                  </div>

                  {task.submission?.status === "submitted" &&
                    task.submission.grade !== undefined && (
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-success/30 bg-success/5 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="success" className="min-w-12 justify-center text-sm font-semibold">
                            {task.submission.grade}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            Nilai dari {task.teacherName}
                          </span>
                        </div>
                        {task.submission.gradeComment && (
                          <p className="text-muted-foreground max-w-xs text-xs italic">
                            “{task.submission.gradeComment}”
                          </p>
                        )}
                      </div>
                    )}

                  <div className="flex items-center justify-between gap-3 border-t pt-4">
                    <StudentTaskStateBadge state={task.taskState} />
                    <Button
                      size="sm"
                      disabled={!canSubmit}
                      onClick={() => openDialog(task)}
                    >
                      {task.submission?.status === "submitted" ? (
                        <>
                          <Pencil className="size-4" />
                          Edit Pengumpulan
                        </>
                      ) : task.submission?.status === "draft" ? (
                        <>
                          <Upload className="size-4" />
                          Lanjutkan & Kumpulkan
                        </>
                      ) : (
                        <>
                          <Upload className="size-4" />
                          Kerjakan
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Pagination
        page={currentPage}
        pageSize={PAGE_SIZE}
        total={filtered.length}
        onPageChange={setPage}
      />

      <Dialog
        open={Boolean(dialogTarget)}
        onOpenChange={(open) => {
          if (!saving) setDialogTarget(open ? dialogTarget : null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTarget?.title}</DialogTitle>
            <DialogDescription>
              {dialogTarget?.subject} · {dialogTarget?.teacherName} · Deadline{" "}
              {dialogTarget ? formatDateTime(dialogTarget.deadline) : "-"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="submission-file">Lampiran (dummy upload)</Label>
              <div className="flex items-center gap-2">
                <FileText className="text-muted-foreground size-4 shrink-0" />
                <Input
                  id="submission-file"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="nama-file-tugas.pdf"
                />
              </div>
              <p className="text-muted-foreground text-xs">
                Ketik nama file tugas kamu. Unggahan sebenarnya tidak
                diproses dalam mode demo.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="submission-notes">Catatan (opsional)</Label>
              <Textarea
                id="submission-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tulis catatan untuk guru…"
              />
            </div>
            {dialogTarget?.status === "closed" && (
              <p className="text-destructive rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs">
                Tugas ini sudah ditutup oleh guru dan tidak dapat menerima
                pengumpulan.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogTarget(null)}
              disabled={Boolean(saving)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={Boolean(saving) || dialogTarget?.status === "closed"}
              onClick={() => handleSave(false)}
            >
              <Clock3 className="size-4" />
              {saving === "draft" ? "Menyimpan…" : "Simpan Draft"}
            </Button>
            <Button
              type="button"
              disabled={Boolean(saving) || dialogTarget?.status === "closed"}
              onClick={() => handleSave(true)}
            >
              <Send className="size-4" />
              {saving === "submit" ? "Mengumpulkan…" : "Kumpulkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
