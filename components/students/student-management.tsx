"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { GraduationCap, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { ExportButton } from "@/components/shared/export-button";
import { EmptyState } from "@/components/shared/empty-state";
import { UserStatusBadge } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { formatDate, getInitials } from "@/lib/format";
import {
  createUser,
  deleteUser,
  getStudents,
  updateUser,
} from "@/services/user-service";
import type { AppUser, UserStatus } from "@/types";

const PAGE_SIZE = 8;

interface StudentFormState {
  name: string;
  email: string;
  nis: string;
  className: string;
  status: UserStatus;
}

const EMPTY_FORM: StudentFormState = {
  name: "",
  email: "",
  nis: "",
  className: "",
  status: "active",
};

export function StudentManagement() {
  const [students, setStudents] = useState<AppUser[] | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [form, setForm] = useState<StudentFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setStudents(await getStudents());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!students) return [];
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.nis ?? "").toLowerCase().includes(q) ||
        (s.className ?? "").toLowerCase().includes(q)
    );
  }, [students, query]);

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

  function openEdit(student: AppUser) {
    setEditing(student);
    setForm({
      name: student.name,
      email: student.email,
      nis: student.nis ?? "",
      className: student.className ?? "",
      status: student.status,
    });
    setDialogOpen(true);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Nama dan email wajib diisi");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateUser(editing.uid, {
          name: form.name,
          email: form.email,
          nis: form.nis || undefined,
          className: form.className || undefined,
          status: form.status,
        });
        toast.success("Data siswa diperbarui");
      } else {
        await createUser({
          name: form.name,
          email: form.email,
          nis: form.nis || undefined,
          className: form.className || undefined,
          status: form.status,
          role: "student",
        });
        toast.success("Siswa baru ditambahkan");
      }
      setDialogOpen(false);
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan data"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget.uid);
      toast.success("Siswa dihapus");
      setDeleteTarget(null);
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menghapus data"
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Siswa"
        description="Kelola data siswa pengguna perpustakaan."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ExportButton
              filename="data-siswa"
              title="Data Siswa"
              disabled={!students || filtered.length === 0}
              columns={[
                { header: "Nama", value: "Nama" },
                { header: "NIS", value: "NIS" },
                { header: "Kelas", value: "Kelas" },
                { header: "Email", value: "Email" },
                { header: "Status", value: "Status" },
              ]}
              rows={filtered.map((student) => [
                student.name,
                student.nis ?? "-",
                student.className ?? "-",
                student.email,
                student.status,
              ])}
            />
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Tambah Siswa
            </Button>
          </div>
        }
      />

      <Card className="gap-0 py-0">
        <CardContent className="px-0 py-0">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Cari siswa berdasarkan nama, NIS, kelas…"
              className="w-full sm:max-w-sm"
            />
            <p className="text-muted-foreground text-sm">
              {filtered.length} siswa
            </p>
          </div>

          {!students ? (
            <div className="p-4">
              <TableSkeleton rows={6} columns={4} />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title={query ? "Tidak ada hasil" : "Belum ada siswa"}
              description={
                query
                  ? `Tidak ditemukan siswa yang cocok dengan "${query}".`
                  : "Tambahkan siswa agar dapat menggunakan perpustakaan."
              }
              action={
                !query ? (
                  <Button size="sm" onClick={openCreate}>
                    <Plus className="size-4" />
                    Tambah Siswa
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Siswa</TableHead>
                  <TableHead>NIS</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Terdaftar</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((student) => (
                  <TableRow key={student.uid}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className="bg-success/10 text-success text-xs font-semibold">
                            {getInitials(student.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{student.name}</p>
                          <p className="text-muted-foreground truncate text-xs">
                            {student.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {student.nis || "-"}
                    </TableCell>
                    <TableCell>
                      {student.className ? (
                        <Badge variant="secondary">{student.className}</Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <UserStatusBadge status={student.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(student.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Aksi">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(student)}>
                            <Pencil className="size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleteTarget(student)}
                          >
                            <Trash2 className="size-4" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Siswa" : "Tambah Siswa Baru"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Perbarui informasi data siswa."
                : "Buat akun siswa baru untuk perpustakaan."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student-name">Nama Lengkap</Label>
              <Input
                id="student-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nama siswa"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-email">Email</Label>
              <Input
                id="student-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="siswa@student.schoolhub.id"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nis">NIS</Label>
                <Input
                  id="nis"
                  value={form.nis}
                  onChange={(e) => setForm({ ...form, nis: e.target.value })}
                  placeholder="22010101"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class">Kelas</Label>
                <Input
                  id="class"
                  value={form.className}
                  onChange={(e) =>
                    setForm({ ...form, className: e.target.value })
                  }
                  placeholder="XI IPA 1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div>
                <Label className="text-sm">Akun Aktif</Label>
                <p className="text-muted-foreground text-xs">
                  Nonaktifkan untuk menonaktifkan akun sementara.
                </p>
              </div>
              <Switch
                checked={form.status === "active"}
                onCheckedChange={(checked) =>
                  setForm({ ...form, status: checked ? "active" : "inactive" })
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
                {saving ? "Menyimpan…" : "Simpan"}
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
        title="Hapus Siswa"
        description={`Yakin ingin menghapus siswa "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
