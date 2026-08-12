"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ClipboardCheck, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
import { todayKey } from "@/lib/academics";
import { formatDate, daysUntil } from "@/lib/format";
import {
  createExamSchedule,
  deleteExamSchedule,
  getExamSchedules,
  updateExamSchedule,
} from "@/services/academic-service";
import { getSubjects } from "@/services/academic-service";
import { getUserById } from "@/services/user-service";
import type { ExamScheduleRecord, SubjectRecord } from "@/types";

interface ExamForm {
  title: string;
  subjectId: string;
  className: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  description: string;
}

const EMPTY_FORM: ExamForm = {
  title: "",
  subjectId: "",
  className: CLASS_OPTIONS[0],
  date: todayKey(),
  startTime: "08:00",
  endTime: "10:00",
  room: "R. 101",
  description: "",
};

export function ExamSchedules() {
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  const [exams, setExams] = useState<ExamScheduleRecord[] | null>(null);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ExamScheduleRecord | null>(null);
  const [form, setForm] = useState<ExamForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ExamScheduleRecord | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const subjectList = await getSubjects();
    setSubjects(subjectList);
    if (isStudent && user) {
      const profile = await getUserById(user.uid);
      const className = profile?.className ?? CLASS_OPTIONS[0];
      const list = await getExamSchedules(className);
      setExams(list);
    } else {
      const list = await getExamSchedules();
      setExams(list);
    }
  }, [isStudent, user]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      subjectId: subjects[0]?.id ?? "",
    });
    setDialogOpen(true);
  }

  function openEdit(exam: ExamScheduleRecord) {
    setEditing(exam);
    setForm({
      title: exam.title,
      subjectId: exam.subjectId,
      className: exam.className,
      date: exam.date,
      startTime: exam.startTime,
      endTime: exam.endTime,
      room: exam.room,
      description: exam.description ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.subjectId) {
      toast.error("Pilih mata pelajaran");
      return;
    }
    if (!form.title.trim()) {
      toast.error("Judul ujian wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        subjectId: form.subjectId,
        className: form.className,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        room: form.room,
        description: form.description.trim() || undefined,
      };
      if (editing) {
        await updateExamSchedule(editing.id, payload);
        toast.success("Jadwal ujian diperbarui");
      } else {
        await createExamSchedule(payload);
        toast.success("Jadwal ujian ditambahkan");
      }
      setDialogOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteExamSchedule(deleteTarget.id);
      toast.success("Jadwal ujian dihapus");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  if (!exams) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jadwal Ujian"
        description="Atur dan pantau jadwal ujian setiap kelas."
        actions={
          !isStudent && (
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Tambah Ujian
            </Button>
          )
        }
      />

      {exams.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Belum ada jadwal ujian"
          description="Jadwal ujian akan muncul di sini."
        />
      ) : (
        <Card className="gap-0 py-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ujian</TableHead>
                  <TableHead>Mapel</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Ruang</TableHead>
                  <TableHead>Status</TableHead>
                  {!isStudent && <TableHead className="text-right">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam) => {
                  const days = daysUntil(exam.date);
                  return (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">
                        {exam.title}
                        {exam.description && (
                          <p className="text-muted-foreground line-clamp-1 text-xs">
                            {exam.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className="inline-flex items-center gap-1.5 text-sm"
                          style={{ color: exam.color }}
                        >
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: exam.color }}
                          />
                          {exam.subjectName}
                        </span>
                      </TableCell>
                      <TableCell>{exam.className}</TableCell>
                      <TableCell>{formatDate(exam.date)}</TableCell>
                      <TableCell>
                        {exam.startTime}–{exam.endTime}
                      </TableCell>
                      <TableCell>{exam.room}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            days < 0
                              ? "secondary"
                              : days === 0
                                ? "warningSoft"
                                : days <= 7
                                  ? "infoSoft"
                                  : "successSoft"
                          }
                        >
                          {days < 0
                            ? "Selesai"
                            : days === 0
                              ? "Hari ini"
                              : `${days} hari lagi`}
                        </Badge>
                      </TableCell>
                      {!isStudent && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(exam)}
                              aria-label="Edit"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => setDeleteTarget(exam)}
                              aria-label="Hapus"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Jadwal Ujian" : "Tambah Jadwal Ujian"}
            </DialogTitle>
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
                  placeholder="Misal: UTS Ganjil"
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
            <div className="grid grid-cols-2 gap-3">
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
                <Label>Tanggal</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, date: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Mulai</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, startTime: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Selesai</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, endTime: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Ruang</Label>
                <Input
                  value={form.room}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, room: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={2}
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
        title="Hapus jadwal ujian"
        description={`Hapus "${deleteTarget?.title ?? ""}" (${deleteTarget?.className ?? ""})?`}
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
