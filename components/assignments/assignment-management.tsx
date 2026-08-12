"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ClipboardList,
  Eye,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Unlock,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { AssignmentStatusBadge } from "@/components/shared/status-badges";
import { AssignmentSubmissions } from "@/components/assignments/assignment-submissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { CLASS_OPTIONS, SUBJECT_OPTIONS } from "@/lib/constants";
import { formatDate, daysUntil } from "@/lib/format";
import {
  createAssignment,
  deleteAssignment,
  getAssignments,
  setAssignmentStatus,
  updateAssignment,
} from "@/services/assignment-service";
import type {
  AssignmentRecord,
  AssignmentStatus,
} from "@/types";

const PAGE_SIZE = 8;

interface AssignmentFormState {
  title: string;
  subject: string;
  description: string;
  className: string;
  deadline: string;
  attachment: string;
  status: AssignmentStatus;
}

const EMPTY_FORM: AssignmentFormState = {
  title: "",
  subject: SUBJECT_OPTIONS[0],
  description: "",
  className: CLASS_OPTIONS[0],
  deadline: "",
  attachment: "",
  status: "open",
};

function toInputDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function AssignmentManagement() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentRecord[] | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AssignmentStatus>("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<AssignmentRecord | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AssignmentRecord | null>(null);
  const [form, setForm] = useState<AssignmentFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AssignmentRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const teacherId = user?.role === "admin" ? user.uid : undefined;

  const load = useCallback(async () => {
    setAssignments(await getAssignments(teacherId));
  }, [teacherId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!assignments) return [];
    const q = query.trim().toLowerCase();
    return assignments.filter((a) => {
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      const matchSubject = subjectFilter === "all" || a.subject === subjectFilter;
      if (!q) return matchStatus && matchSubject;
      return (
        matchStatus &&
        matchSubject &&
        (a.title.toLowerCase().includes(q) ||
          a.subject.toLowerCase().includes(q) ||
          a.className.toLowerCase().includes(q) ||
          a.teacherName.toLowerCase().includes(q))
      );
    });
  }, [assignments, query, statusFilter, subjectFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(assignment: AssignmentRecord) {
    setEditing(assignment);
    setForm({
      title: assignment.title,
      subject: assignment.subject,
      description: assignment.description,
      className: assignment.className,
      deadline: toInputDate(assignment.deadline),
      attachment: assignment.attachment ?? "",
      status: assignment.status,
    });
    setDialogOpen(true);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    if (!form.title.trim()) {
      toast.error("Judul tugas wajib diisi");
      return;
    }
    if (!form.deadline) {
      toast.error("Deadline wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        subject: form.subject,
        description: form.description.trim(),
        className: form.className,
        deadline: new Date(`${form.deadline}T23:59:59`).toISOString(),
        attachment: form.attachment.trim() || undefined,
        status: form.status,
      };
      if (editing) {
        await updateAssignment(editing.id, payload);
        toast.success("Tugas diperbarui");
      } else {
        await createAssignment({ ...payload, teacherId: user.uid });
        toast.success("Tugas baru dibuat");
      }
      setDialogOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan tugas");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(assignment: AssignmentRecord) {
    setTogglingId(assignment.id);
    const next: AssignmentStatus = assignment.status === "open" ? "closed" : "open";
    try {
      await setAssignmentStatus(assignment.id, next);
      toast.success(next === "open" ? "Tugas dibuka kembali" : "Tugas ditutup");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengubah status");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAssignment(deleteTarget.id);
      toast.success("Tugas dihapus");
      setDeleteTarget(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus tugas");
    } finally {
      setDeleting(false);
    }
  }

  if (viewing) {
    return (
      <div className="space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewing(null)}
            className="mb-2 -ml-2 text-muted-foreground"
          >
            <ArrowLeft className="size-4" />
            Kembali ke daftar tugas
          </Button>
        </div>
        <AssignmentSubmissions assignment={viewing} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Tugas"
        description="Buat dan kelola tugas untuk siswa."
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Tambah Tugas
          </Button>
        }
      />

      <Card className="gap-0 py-0">
        <CardContent className="px-0 py-0">
          <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Cari judul, mapel, kelas, atau guru…"
              className="w-full lg:max-w-sm"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as "all" | AssignmentStatus)
                }
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Semua status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua status</SelectItem>
                  <SelectItem value="open">Aktif</SelectItem>
                  <SelectItem value="closed">Ditutup</SelectItem>
                </SelectContent>
              </Select>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Semua mapel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua mapel</SelectItem>
                  {SUBJECT_OPTIONS.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-sm">
                {filtered.length} tugas
              </p>
            </div>
          </div>

          {!assignments ? (
            <div className="p-4">
              <TableSkeleton rows={6} columns={5} />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title={query ? "Tidak ada hasil" : "Belum ada tugas"}
              description={
                query
                  ? `Tidak ditemukan tugas yang cocok dengan "${query}".`
                  : "Buat tugas baru agar siswa dapat mulai mengerjakan."
              }
              action={
                !query ? (
                  <Button size="sm" onClick={openCreate}>
                    <Plus className="size-4" />
                    Tambah Tugas
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tugas</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((assignment) => {
                  const days = daysUntil(assignment.deadline);
                  return (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <p className="max-w-56 truncate font-medium">
                          {assignment.title}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {assignment.subject} · {assignment.teacherName}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{assignment.className}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(assignment.deadline)}
                        {assignment.status === "open" && (
                          <span
                            className={
                              days < 0
                                ? "text-destructive block text-xs"
                                : "text-muted-foreground block text-xs"
                            }
                          >
                            {days < 0
                              ? `Terlambat ${Math.abs(days)} hari`
                              : days === 0
                                ? "Hari ini"
                                : `Sisa ${days} hari`}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <AssignmentStatusBadge status={assignment.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Aksi"
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setViewing(assignment)}
                            >
                              <Eye className="size-4" />
                              Lihat Pengumpulan
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openEdit(assignment)}
                            >
                              <Pencil className="size-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={togglingId === assignment.id}
                              onClick={() => handleToggleStatus(assignment)}
                            >
                              {assignment.status === "open" ? (
                                <>
                                  <Lock className="size-4" />
                                  Tutup Tugas
                                </>
                              ) : (
                                <>
                                  <Unlock className="size-4" />
                                  Buka Kembali
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteTarget(assignment)}
                            >
                              <Trash2 className="size-4" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          <div className="border-t p-4">
            <Pagination
              page={currentPage}
              pageSize={PAGE_SIZE}
              total={filtered.length}
              onPageChange={setPage}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!saving) {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Tugas" : "Buat Tugas Baru"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Perbarui informasi tugas."
                : "Lengkapi informasi tugas untuk siswa."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Judul</Label>
              <Input
                id="task-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Contoh: Persamaan Linear Dua Variabel"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Mata Pelajaran</Label>
                <Select
                  value={form.subject}
                  onValueChange={(value) =>
                    setForm({ ...form, subject: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih mapel" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECT_OPTIONS.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kelas</Label>
                <Select
                  value={form.className}
                  onValueChange={(value) =>
                    setForm({ ...form, className: value })
                  }
                >
                  <SelectTrigger className="w-full">
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
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-desc">Deskripsi</Label>
              <Textarea
                id="task-desc"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Jelaskan detail tugas…"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="task-deadline">Deadline</Label>
                <Input
                  id="task-deadline"
                  type="date"
                  value={form.deadline}
                  onChange={(e) =>
                    setForm({ ...form, deadline: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-attachment">Lampiran (dummy)</Label>
                <Input
                  id="task-attachment"
                  value={form.attachment}
                  onChange={(e) =>
                    setForm({ ...form, attachment: e.target.value })
                  }
                  placeholder="lampiran-tugas.pdf"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div>
                <Label className="text-sm">Status Tugas</Label>
                <p className="text-muted-foreground text-xs">
                  Tugas yang ditutup tidak dapat menerima pengumpulan.
                </p>
              </div>
              <Switch
                checked={form.status === "open"}
                onCheckedChange={(checked) =>
                  setForm({ ...form, status: checked ? "open" : "closed" })
                }
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Menyimpan…" : editing ? "Simpan Perubahan" : "Buat Tugas"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!deleting) setDeleteTarget(open ? deleteTarget : null);
        }}
        title="Hapus Tugas"
        description={`Yakin ingin menghapus tugas "${deleteTarget?.title}" beserta seluruh pengumpulannya? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
