"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/services/category-service";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

const COLOR_OPTIONS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"];

interface CategoryFormState {
  name: string;
  description: string;
  color: string;
}

const EMPTY_FORM: CategoryFormState = {
  name: "",
  description: "",
  color: "chart-1",
};

export function CategoryManagement() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setCategories(await getCategories());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setForm({
      name: category.name,
      description: category.description,
      color: category.color,
    });
    setDialogOpen(true);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Nama kategori wajib diisi");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateCategory(editing.id, {
          name: form.name,
          description: form.description,
          color: form.color,
        });
        toast.success("Kategori diperbarui");
      } else {
        await createCategory(form);
        toast.success("Kategori baru ditambahkan");
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
      await deleteCategory(deleteTarget.id);
      toast.success("Kategori dihapus");
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
        title="Kelola Kategori"
        description="Kelompokkan buku ke dalam kategori agar mudah ditemukan."
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Tambah Kategori
          </Button>
        }
      />

      {!categories ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-xl border bg-card p-5">
              <TableSkeleton rows={2} columns={1} />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="Belum ada kategori"
          description="Tambahkan kategori untuk mengelompokkan koleksi buku."
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              Tambah Kategori
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const color = `var(--color-${category.color || "chart-1"})`;
            return (
              <Card key={category.id} className="gap-0 py-0">
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div
                    className="flex size-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    <Tags className="size-5" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Aksi">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(category)}>
                        <Pencil className="size-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteTarget(category)}
                      >
                        <Trash2 className="size-4" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{category.name}</CardTitle>
                    <span className="text-muted-foreground text-xs font-medium">
                      {category.bookCount} buku
                    </span>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {category.description || "Tanpa deskripsi."}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
              {editing ? "Edit Kategori" : "Tambah Kategori Baru"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Perbarui informasi kategori."
                : "Buat kategori baru untuk koleksi buku."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nama Kategori</Label>
              <Input
                id="category-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="contoh: Fiksi"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-desc">Deskripsi</Label>
              <Textarea
                id="category-desc"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Deskripsi singkat kategori"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Warna</Label>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((option) => {
                  const color = `var(--color-${option})`;
                  const selected = form.color === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setForm({ ...form, color: option })}
                      className={cn(
                        "size-8 rounded-full ring-2 ring-offset-2 transition-all",
                        selected ? "ring-ring scale-110" : "ring-transparent"
                      )}
                      style={{ backgroundColor: color }}
                      aria-label={`Pilih warna ${option}`}
                    />
                  );
                })}
              </div>
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
        title="Hapus Kategori"
        description={`Yakin ingin menghapus kategori "${deleteTarget?.name}"?`}
        confirmLabel="Hapus"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
