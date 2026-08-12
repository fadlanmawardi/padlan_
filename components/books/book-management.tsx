"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BookMarked,
  LibraryBig,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ExportButton } from "@/components/shared/export-button";
import { BookStatusBadge } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createBook,
  deleteBook,
  getBooks,
  updateBook,
} from "@/services/book-service";
import { getCategories } from "@/services/category-service";
import type { BookRecord, Category } from "@/types";

const PAGE_SIZE = 8;

interface BookFormState {
  title: string;
  author: string;
  isbn: string;
  categoryId: string;
  publisher: string;
  year: string;
  totalCopies: string;
}

const EMPTY_FORM: BookFormState = {
  title: "",
  author: "",
  isbn: "",
  categoryId: "",
  publisher: "",
  year: String(new Date().getFullYear()),
  totalCopies: "1",
};

export function BookManagement() {
  const [books, setBooks] = useState<BookRecord[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BookRecord | null>(null);
  const [form, setForm] = useState<BookFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<BookRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setBooks(await getBooks());
  }, []);

  useEffect(() => {
    void load();
    void getCategories().then(setCategories);
  }, [load]);

  const filtered = useMemo(() => {
    if (!books) return [];
    const q = query.trim().toLowerCase();
    return books.filter((book) => {
      const matchCategory =
        categoryFilter === "all" || book.categoryId === categoryFilter;
      if (!q) return matchCategory;
      return (
        matchCategory &&
        (book.title.toLowerCase().includes(q) ||
          book.author.toLowerCase().includes(q) ||
          book.isbn.toLowerCase().includes(q) ||
          book.categoryName.toLowerCase().includes(q))
      );
    });
  }, [books, query, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function openCreate() {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      categoryId: categories[0]?.id ?? "",
    });
    setDialogOpen(true);
  }

  function openEdit(book: BookRecord) {
    setEditing(book);
    setForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      categoryId: book.categoryId,
      publisher: book.publisher,
      year: String(book.year),
      totalCopies: String(book.totalCopies),
    });
    setDialogOpen(true);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || !form.author.trim() || !form.categoryId) {
      toast.error("Judul, penulis, dan kategori wajib diisi");
      return;
    }
    const year = Number(form.year);
    const totalCopies = Number(form.totalCopies);
    if (!year || year < 1500 || year > new Date().getFullYear() + 1) {
      toast.error("Tahun terbit tidak valid");
      return;
    }
    if (!totalCopies || totalCopies < 1) {
      toast.error("Jumlah salinan minimal 1");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateBook(editing.id, {
          title: form.title,
          author: form.author,
          isbn: form.isbn,
          categoryId: form.categoryId,
          publisher: form.publisher,
          year,
          totalCopies,
        });
        toast.success("Data buku diperbarui");
      } else {
        await createBook({
          title: form.title,
          author: form.author,
          isbn: form.isbn,
          categoryId: form.categoryId,
          publisher: form.publisher,
          year,
          totalCopies,
        });
        toast.success("Buku baru ditambahkan");
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
      await deleteBook(deleteTarget.id);
      toast.success("Buku dihapus");
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
        title="Kelola Buku"
        description="Kelola koleksi buku perpustakaan."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ExportButton
              filename="koleksi-buku"
              title="Koleksi Buku Perpustakaan"
              disabled={!books || books.length === 0}
              columns={[
                { header: "Judul", value: "Judul" },
                { header: "Penulis", value: "Penulis" },
                { header: "ISBN", value: "ISBN" },
                { header: "Kategori", value: "Kategori" },
                { header: "Stok", value: "Stok" },
                { header: "Tersedia", value: "Tersedia" },
              ]}
              rows={filtered.map((book) => [
                book.title,
                book.author,
                book.isbn,
                categories.find((c) => c.id === book.categoryId)?.name ?? "-",
                String(book.totalCopies),
                String(book.availableCopies),
              ])}
            />
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Tambah Buku
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
              placeholder="Cari judul, penulis, ISBN, kategori…"
              className="w-full sm:max-w-sm"
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Semua kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua kategori</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!books ? (
            <div className="p-4">
              <TableSkeleton rows={6} columns={4} />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={LibraryBig}
              title={query || categoryFilter !== "all" ? "Tidak ada hasil" : "Belum ada buku"}
              description={
                query || categoryFilter !== "all"
                  ? "Tidak ditemukan buku yang sesuai dengan filter."
                  : "Tambahkan buku untuk memperkaya koleksi perpustakaan."
              }
              action={
                !query && categoryFilter === "all" ? (
                  <Button size="sm" onClick={openCreate}>
                    <Plus className="size-4" />
                    Tambah Buku
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Buku</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Tahun</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                          <BookMarked className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-64 truncate font-medium">
                            {book.title}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">
                            {book.author} · ISBN {book.isbn || "-"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {book.categoryName}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {book.year}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {book.availableCopies} / {book.totalCopies}
                    </TableCell>
                    <TableCell>
                      <BookStatusBadge status={book.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Aksi">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(book)}>
                            <Pencil className="size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleteTarget(book)}
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
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Buku" : "Tambah Buku Baru"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Perbarui informasi koleksi buku."
                : "Tambahkan koleksi buku baru ke perpustakaan."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Buku</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Judul buku"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="author">Penulis</Label>
                <Input
                  id="author"
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  placeholder="Nama penulis"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN</Label>
                <Input
                  id="isbn"
                  value={form.isbn}
                  onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                  placeholder="978-xxx-xxx"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(value) =>
                    setForm({ ...form, categoryId: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="publisher">Penerbit</Label>
                <Input
                  id="publisher"
                  value={form.publisher}
                  onChange={(e) =>
                    setForm({ ...form, publisher: e.target.value })
                  }
                  placeholder="Nama penerbit"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="year">Tahun Terbit</Label>
                <Input
                  id="year"
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  placeholder="2024"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="copies">Jumlah Salinan</Label>
                <Input
                  id="copies"
                  type="number"
                  min={1}
                  value={form.totalCopies}
                  onChange={(e) =>
                    setForm({ ...form, totalCopies: e.target.value })
                  }
                  placeholder="1"
                />
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
        title="Hapus Buku"
        description={`Yakin ingin menghapus buku "${deleteTarget?.title}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
