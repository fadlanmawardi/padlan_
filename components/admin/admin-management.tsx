"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { UserStatusBadge } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { useAuth } from "@/components/auth/auth-provider";
import { formatDate, getInitials } from "@/lib/format";
import {
  createUser,
  deleteUser,
  getAdmins,
  updateUser,
} from "@/services/user-service";
import type { AppUser, UserStatus } from "@/types";

const PAGE_SIZE = 8;

interface AdminFormState {
  name: string;
  email: string;
  phone: string;
  status: UserStatus;
}

const EMPTY_FORM: AdminFormState = {
  name: "",
  email: "",
  phone: "",
  status: "active",
};

export function AdminManagement() {
  const { user: currentUser } = useAuth();
  const [admins, setAdmins] = useState<AppUser[] | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [form, setForm] = useState<AdminFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setAdmins(await getAdmins());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!admins) return [];
    const q = query.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        (a.phone ?? "").toLowerCase().includes(q)
    );
  }, [admins, query]);

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

  function openEdit(admin: AppUser) {
    setEditing(admin);
    setForm({
      name: admin.name,
      email: admin.email,
      phone: admin.phone ?? "",
      status: admin.status,
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
          phone: form.phone || undefined,
          status: form.status,
        });
        toast.success("Data admin diperbarui");
      } else {
        await createUser({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          status: form.status,
          role: "admin",
        });
        toast.success("Admin baru ditambahkan");
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
      toast.success("Admin dihapus");
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
        title="Kelola Admin"
        description="Kelola akun admin perpustakaan."
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Tambah Admin
          </Button>
        }
      />

      <Card className="gap-0 py-0">
        <CardContent className="px-0 py-0">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Cari admin berdasarkan nama, email, telepon…"
              className="w-full sm:max-w-sm"
            />
            <p className="text-muted-foreground text-sm">
              {filtered.length} admin
            </p>
          </div>

          {!admins ? (
            <div className="p-4">
              <TableSkeleton rows={6} columns={4} />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title={query ? "Tidak ada hasil" : "Belum ada admin"}
              description={
                query
                  ? `Tidak ditemukan admin yang cocok dengan "${query}".`
                  : "Tambahkan admin untuk membantu mengelola perpustakaan."
              }
              action={
                !query ? (
                  <Button size="sm" onClick={openCreate}>
                    <Plus className="size-4" />
                    Tambah Admin
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bergabung</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((admin) => {
                  const isSelf = admin.uid === currentUser?.uid;
                  return (
                    <TableRow key={admin.uid}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {getInitials(admin.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{admin.name}</p>
                            <p className="text-muted-foreground truncate text-xs">
                              {admin.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {admin.phone || "-"}
                      </TableCell>
                      <TableCell>
                        <UserStatusBadge status={admin.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(admin.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Aksi">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(admin)}>
                              <Pencil className="size-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              disabled={isSelf}
                              onClick={() => setDeleteTarget(admin)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Admin" : "Tambah Admin Baru"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Perbarui informasi akun admin."
                : "Buat akun admin baru untuk mengelola perpustakaan."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nama admin"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@schoolhub.id"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Nomor Telepon</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="08xxxxxxxxxx"
              />
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
        title="Hapus Admin"
        description={`Yakin ingin menghapus admin "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
