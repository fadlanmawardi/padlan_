"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BookMarked, LibraryBig, SearchX } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { BookStatusBadge } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { getBooks } from "@/services/book-service";
import { getCategories } from "@/services/category-service";
import { createLoan } from "@/services/loan-service";
import { getSettings } from "@/services/settings-service";
import type { BookRecord, Category } from "@/types";

export function BookCatalog() {
  const { user } = useAuth();
  const [books, setBooks] = useState<BookRecord[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [borrowing, setBorrowing] = useState<BookRecord | null>(null);
  const [duration, setDuration] = useState(7);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setBooks(await getBooks());
  }, []);

  useEffect(() => {
    void load();
    void Promise.all([getCategories(), getSettings()]).then(
      ([categoryList, settings]) => {
        setCategories(categoryList);
        setDuration(settings.loanDurationDays);
      }
    );
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
          book.categoryName.toLowerCase().includes(q) ||
          book.isbn.toLowerCase().includes(q))
      );
    });
  }, [books, query, categoryFilter]);

  async function handleBorrow(event: React.FormEvent) {
    event.preventDefault();
    if (!borrowing || !user) return;
    setSubmitting(true);
    try {
      await createLoan({
        bookId: borrowing.id,
        studentId: user.uid,
        durationDays: duration,
      });
      toast.success(`"${borrowing.title}" berhasil dipinjam`);
      setBorrowing(null);
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal meminjam buku"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cari Buku"
        description="Jelajahi koleksi buku yang tersedia di perpustakaan."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Cari judul, penulis, atau kategori…"
          className="w-full sm:max-w-md"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-56 animate-pulse rounded-xl border bg-card"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Buku tidak ditemukan"
          description="Coba ubah kata kunci atau filter kategori."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((book) => (
            <Card key={book.id} className="gap-0 py-0">
              <CardHeader className="flex flex-row items-start gap-4">
                <div className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-lg">
                  <BookMarked className="size-6" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <CardTitle className="line-clamp-2 text-base">
                    {book.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-1">
                    {book.author}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="secondary">{book.categoryName}</Badge>
                  <span className="text-muted-foreground">{book.year}</span>
                  <span className="text-muted-foreground">
                    ISBN {book.isbn || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <BookStatusBadge status={book.status} />
                  <span className="text-muted-foreground text-xs">
                    {book.availableCopies}/{book.totalCopies} tersedia
                  </span>
                </div>
                <Button
                  className="w-full"
                  disabled={book.availableCopies === 0}
                  onClick={() => setBorrowing(book)}
                >
                  <LibraryBig className="size-4" />
                  {book.availableCopies === 0 ? "Stok Habis" : "Pinjam Buku"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={Boolean(borrowing)} onOpenChange={(open) => { if (!submitting) setBorrowing(open ? borrowing : null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Peminjaman</DialogTitle>
            <DialogDescription>
              Kamu akan meminjam buku <span className="font-medium text-foreground">{borrowing?.title}</span>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBorrow} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loan-duration">Durasi Peminjaman (hari)</Label>
              <Input
                id="loan-duration"
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
              <p className="text-muted-foreground text-xs">
                Kembalikan buku sebelum jatuh tempo untuk menghindari denda.
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setBorrowing(null)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Memproses…" : "Konfirmasi Pinjam"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
