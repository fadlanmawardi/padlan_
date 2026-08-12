"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
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
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";
import {
  createSubject,
  deleteSubject,
  getSubjects,
  updateSubject,
} from "@/services/academic-service";
import { getAdmins } from "@/services/user-service";
import type { AppUser, SubjectRecord } from "@/types";

const SUBJECT_COLORS = [
  "#2563eb",
  "#0ea5e9",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
  "#6366f1",
  "#d946ef",
  "#22c55e",
  "#f97316",
  "#0d9488",
];

const GRADE_LEVELS = ["10", "11", "12"];

interface SubjectForm {
  name: string;
  code: string;
  description: string;
  color: string;
  teacherId: string;
  gradeLevel: string;
}

const EMPTY_FORM: SubjectForm = {
  name: "",
  code: "",
  description: "",
  color: SUBJECT_COLORS[0],
  teacherId: "",
  gradeLevel: "10",
};

export function SubjectsManagement() {
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  const [subjects, setSubjects] = useState<SubjectRecord[] | null>(null);
  const [teachers, setTeachers] = useState<AppUser[]>([]);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SubjectRecord | null>(null);
  const [form, setForm] = useState<SubjectForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SubjectRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const [subjectList, teacherList] = await Promise.all([
      getSubjects(),
      getAdmins(),
    ]);
    setSubjects(subjectList);
    setTeachers(teacherList);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      teacherId: teachers[0]?.uid ?? "",
    });
    setDialogOpen(true);
  }

  function openEdit(subject: SubjectRecord) {
    setEditing(subject);
    setForm({
      name: subject.name,
      code: subject.code,
      description: subject.description,
      color: subject.color,
      teacherId: subject.teacherId,
      gradeLevel: subject.gradeLevel,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.code.trim()) {
      toast.error("Nama dan kode mata pelajaran wajib diisi");
      return;
    }
    if (!form.teacherId) {
      toast.error("Pilih guru pengajar");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        color: form.color,
        teacherId: form.teacherId,
        gradeLevel: form.gradeLevel,
      };
      if (editing) {
        await updateSubject(editing.id, payload);
        toast.success("Mata pelajaran diperbarui");
      } else {
        await createSubject(payload);
        toast.success("Mata pelajaran ditambahkan");
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
      await deleteSubject(deleteTarget.id);
      toast.success("Mata pelajaran dihapus");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  const filtered = (subjects ?? []).filter(
    (subject) =>
      subject.name.toLowerCase().includes(query.toLowerCase()) ||
      subject.code.toLowerCase().includes(query.toLowerCase())
  );

  if (!subjects) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mata Pelajaran"
        description="Kelola daftar mata pelajaran beserta guru pengajar."
        actions={
          !isStudent && (
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Tambah Mapel
            </Button>
          )
        }
      />

      {!isStudent && (
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari mata pelajaran…"
          className="max-w-sm"
        />
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Tidak ada mata pelajaran"
          description="Tambahkan mata pelajaran baru untuk mulai mengelola kurikulum."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((subject) => (
            <Card key={subject.id} className="gap-0 py-0">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="flex size-11 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${subject.color}18`, color: subject.color }}
                  >
                    <BookOpen className="size-5" />
                  </div>
                  {!isStudent && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => openEdit(subject)}
                        aria-label="Edit"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        onClick={() => setDeleteTarget(subject)}
                        aria-label="Hapus"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <h3 className="mt-3 truncate font-semibold">{subject.name}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary" className="font-mono">
                    {subject.code}
                  </Badge>
                  <Badge variant="outline">Kelas {subject.gradeLevel}</Badge>
                </div>
                <p className="text-muted-foreground mt-2 line-clamp-2 text-xs">
                  {subject.description || "Tanpa deskripsi"}
                </p>
                <div className="text-muted-foreground mt-3 border-t pt-3 text-xs">
                  <span className="font-medium text-foreground">
                    {subject.teacherName}
                  </span>{" "}
                  · {subject.scheduleCount} jadwal · {subject.materialCount} materi
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label>Nama</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Misal: Matematika"
                />
              </div>
              <div className="space-y-2">
                <Label>Kode</Label>
                <Input
                  value={form.code}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, code: e.target.value }))
                  }
                  placeholder="MTK"
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
            <div className="space-y-2">
              <Label>Warna</Label>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, color }))}
                    className={cn(
                      "size-7 rounded-full transition-transform",
                      form.color === color &&
                        "ring-2 ring-offset-2 ring-foreground scale-110"
                    )}
                    style={{ backgroundColor: color }}
                    aria-label={`Warna ${color}`}
                  />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
              <div className="space-y-2">
                <Label>Tingkat</Label>
                <Select
                  value={form.gradeLevel}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, gradeLevel: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        Kelas {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
        title="Hapus mata pelajaran"
        description={`Hapus "${deleteTarget?.name ?? ""}"? Jadwal terkait juga akan dihapus.`}
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
