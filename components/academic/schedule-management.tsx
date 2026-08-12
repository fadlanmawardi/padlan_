"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useAuth } from "@/components/auth/auth-provider";
import { PageLoader } from "@/components/shared/loading-screen";
import { CLASS_OPTIONS } from "@/lib/constants";
import { DAY_NAMES, DAY_NAMES_SHORT, jsDayToIndex } from "@/lib/academics";
import { cn } from "@/lib/utils";
import {
  createScheduleEntry,
  deleteScheduleEntry,
  getScheduleByClass,
  getSchedules,
  updateScheduleEntry,
} from "@/services/academic-service";
import { getSubjects } from "@/services/academic-service";
import { getAdmins } from "@/services/user-service";
import { getUserById } from "@/services/user-service";
import type { AppUser, ScheduleEntryRecord, SubjectRecord } from "@/types";

const SLOTS = [
  { startTime: "07:00", endTime: "08:30" },
  { startTime: "08:30", endTime: "10:00" },
  { startTime: "10:15", endTime: "11:45" },
  { startTime: "12:30", endTime: "14:00" },
  { startTime: "14:00", endTime: "15:30" },
];

interface ScheduleForm {
  className: string;
  subjectId: string;
  teacherId: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
}

const EMPTY_FORM: ScheduleForm = {
  className: CLASS_OPTIONS[0],
  subjectId: "",
  teacherId: "",
  day: "0",
  startTime: "07:00",
  endTime: "08:30",
  room: "R. 101",
};

export function ScheduleManagement() {
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  const [entries, setEntries] = useState<ScheduleEntryRecord[] | null>(null);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [teachers, setTeachers] = useState<AppUser[]>([]);
  const [studentClassName, setStudentClassName] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>(CLASS_OPTIONS[0]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleEntryRecord | null>(null);
  const [form, setForm] = useState<ScheduleForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleEntryRecord | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  const todayDay = jsDayToIndex(new Date().getDay());

  const load = useCallback(async () => {
    const [subjectList, teacherList] = await Promise.all([
      getSubjects(),
      getAdmins(),
    ]);
    setSubjects(subjectList);
    setTeachers(teacherList);
    if (isStudent && user) {
      const profile = await getUserById(user.uid);
      const className = profile?.className ?? CLASS_OPTIONS[0];
      setStudentClassName(className);
      setSelectedClass(className);
      const list = await getScheduleByClass(className);
      setEntries(list);
    } else {
      setSelectedClass(CLASS_OPTIONS[0]);
      const list = await getSchedules(CLASS_OPTIONS[0]);
      setEntries(list);
    }
  }, [isStudent, user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function loadClass(className: string) {
    setEntries(null);
    setSelectedClass(className);
    const list = await getSchedules(className);
    setEntries(list);
  }

  function openCreate() {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      className: selectedClass,
      subjectId: subjects[0]?.id ?? "",
      teacherId: subjects[0]?.teacherId ?? teachers[0]?.uid ?? "",
    });
    setDialogOpen(true);
  }

  function openEdit(entry: ScheduleEntryRecord) {
    setEditing(entry);
    setForm({
      className: entry.className,
      subjectId: entry.subjectId,
      teacherId: entry.teacherId,
      day: String(entry.day),
      startTime: entry.startTime,
      endTime: entry.endTime,
      room: entry.room,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.subjectId || !form.teacherId) {
      toast.error("Pilih mata pelajaran dan guru terlebih dahulu");
      return;
    }
    if (form.startTime >= form.endTime) {
      toast.error("Jam selesai harus lebih lambat dari jam mulai");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateScheduleEntry(editing.id, {
          ...form,
          day: Number(form.day),
        });
        toast.success("Jadwal diperbarui");
      } else {
        await createScheduleEntry({
          ...form,
          day: Number(form.day),
        });
        toast.success("Jadwal ditambahkan");
      }
      setDialogOpen(false);
      await loadClass(form.className);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan jadwal");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteScheduleEntry(deleteTarget.id);
      toast.success("Jadwal dihapus");
      await loadClass(selectedClass);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus jadwal");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  const grouped = useMemo(() => {
    const map: Record<number, ScheduleEntryRecord[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    for (const entry of entries ?? []) {
      map[entry.day]?.push(entry);
    }
    for (const day of Object.keys(map)) {
      map[Number(day)].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [entries]);

  if (!entries) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jadwal Pelajaran"
        description={
          isStudent
            ? `Jadwal mingguan kelas ${studentClassName ?? selectedClass}.`
            : "Atur jadwal pelajaran setiap kelas."
        }
        actions={
          !isStudent && (
            <div className="flex items-center gap-2">
              <Select
                value={selectedClass}
                onValueChange={(value) => void loadClass(value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_OPTIONS.map((className) => (
                    <SelectItem key={className} value={className}>
                      {className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={openCreate}>
                <Plus className="size-4" />
                Tambah Jadwal
              </Button>
            </div>
          )
        }
      />

      {isStudent && (
        <div className="flex flex-wrap gap-2">
          {DAY_NAMES.map((day, index) => (
            <Badge
              key={day}
              variant={index === todayDay ? "default" : "secondary"}
              className={cn(index === todayDay && "text-primary-foreground")}
            >
              {index === todayDay ? `Hari ini · ${day}` : day}
            </Badge>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-0 sm:p-1">
          <div className="grid grid-cols-[4.5rem_1fr_1fr_1fr_1fr_1fr_1fr] gap-px overflow-x-auto text-sm min-w-[720px]">
            <div className="flex items-end justify-center pb-3 text-xs font-medium text-muted-foreground">
              Waktu
            </div>
            {DAY_NAMES.map((day, index) => (
              <div
                key={day}
                className={cn(
                  "flex items-center justify-center border-b pb-3 text-xs font-semibold",
                  index === todayDay && "text-primary"
                )}
              >
                <span className="sm:hidden">{DAY_NAMES_SHORT[index]}</span>
                <span className="hidden sm:inline">{day}</span>
              </div>
            ))}
            {SLOTS.map((slot) => (
              <div key={slot.startTime} className="contents">
                <div className="flex items-center justify-center border-t py-2 text-xs font-medium text-muted-foreground">
                  {slot.startTime}
                </div>
                {DAY_NAMES.map((day, dayIndex) => {
                  const entry = grouped[dayIndex].find(
                    (e) => e.startTime === slot.startTime
                  );
                  return (
                    <div
                      key={day}
                      className={cn(
                        "flex min-h-20 flex-col justify-center gap-1 border-t px-2 py-2",
                        dayIndex === todayDay && "bg-primary/5"
                      )}
                    >
                      {entry ? (
                        <button
                          type="button"
                          onClick={() => !isStudent && openEdit(entry)}
                          className="group flex h-full w-full flex-col items-start justify-center rounded-md px-2 py-1.5 text-left transition-colors hover:ring-1"
                          style={{ backgroundColor: `${entry.color}14` }}
                        >
                          <span
                            className="w-full truncate text-xs font-semibold"
                            style={{ color: entry.color }}
                          >
                            {entry.subjectName}
                          </span>
                          <span className="text-muted-foreground text-[11px]">
                            {entry.startTime}–{entry.endTime}
                          </span>
                          <span className="text-muted-foreground text-[11px]">
                            {entry.room}
                          </span>
                          {!isStudent && (
                            <span className="text-muted-foreground flex gap-2 pt-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <Pencil className="size-3" />
                              <Trash2
                                className="size-3"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget(entry);
                                }}
                              />
                            </span>
                          )}
                        </button>
                      ) : (
                        <span className="text-muted-foreground/50 mx-auto text-[11px]">
                          —
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {!isStudent && entries.length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title="Belum ada jadwal"
          description="Tambahkan jadwal pelajaran untuk kelas ini."
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Jadwal" : "Tambah Jadwal"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
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
                <Label>Hari</Label>
                <Select
                  value={form.day}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, day: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAY_NAMES.map((day, index) => (
                      <SelectItem key={day} value={String(index)}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            <div className="space-y-2">
              <Label>Guru Pengajar</Label>
              <Select
                value={form.teacherId}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, teacherId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih guru" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.uid} value={teacher.uid}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        title="Hapus jadwal"
        description={`Hapus jadwal ${deleteTarget?.subjectName ?? ""} untuk ${deleteTarget?.className ?? ""}?`}
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
