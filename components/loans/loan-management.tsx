"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeftRight, Plus, Undo2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { LoanStatusBadge } from "@/components/shared/status-badges";
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
import { formatCurrency, formatDate } from "@/lib/format";
import { getStudents } from "@/services/user-service";
import { getBooks } from "@/services/book-service";
import { createLoan, getLoans, returnLoan } from "@/services/loan-service";
import { getSettings } from "@/services/settings-service";
import type { BookRecord, LoanRecord, LoanStatus } from "@/types";

const PAGE_SIZE = 8;

interface LoanFormState {
  bookId: string;
  studentId: string;
  durationDays: string;
}

export function LoanManagement() {
  const [loans, setLoans] = useState<LoanRecord[] | null>(null);
  const [books, setBooks] = useState<BookRecord[]>([]);
  const [students, setStudents] = useState<Awaited<ReturnType<typeof getStudents>>>([]);
  const [defaultDuration, setDefaultDuration] = useState(7);
  const [statusFilter, setStatusFilter] = useState<"all" | LoanStatus>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<LoanFormState>({
    bookId: "",
    studentId: "",
    durationDays: "7",
  });
  const [saving, setSaving] = useState(false);
  const [returningId, setReturningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoans(await getLoans());
  }, []);

  useEffect(() => {
    void load();
    void Promise.all([getBooks(), getStudents(), getSettings()]).then(
      ([bookList, studentList, settings]) => {
        setBooks(bookList);
        setStudents(studentList);
        setDefaultDuration(settings.loanDurationDays);
      }
    );
  }, [load]);

  const availableBooks = useMemo(
    () => books.filter((b) => b.availableCopies > 0),
    [books]
  );

  const filtered = useMemo(() => {
    if (!loans) return [];
    const q = query.trim().toLowerCase();
    return loans.filter((loan) => {
      const matchStatus =
        statusFilter === "all" || loan.status === statusFilter;
      if (!q) return matchStatus;
      return (
        matchStatus &&
        (loan.bookTitle.toLowerCase().includes(q) ||
          loan.studentName.toLowerCase().includes(q) ||
          loan.id.toLowerCase().includes(q))
      );
    });
  }, [loans, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function openCreate() {
    setForm({
      bookId: availableBooks[0]?.id ?? "",
      studentId: students[0]?.uid ?? "",
      durationDays: String(defaultDuration),
    });
    setDialogOpen(true);
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!form.bookId || !form.studentId) {
      toast.error("Pilih buku dan siswa");
      return;
    }
    const durationDays = Number(form.durationDays);
    if (!durationDays || durationDays < 1) {
      toast.error("Durasi peminjaman tidak valid");
      return;
    }
    setSaving(true);
    try {
      await createLoan({
        bookId: form.bookId,
        studentId: form.studentId,
        durationDays,
      });
      toast.success("Peminjaman berhasil dibuat");
      setDialogOpen(false);
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal membuat peminjaman"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleReturn(loanId: string) {
    setReturningId(loanId);
    try {
      await returnLoan(loanId);
      toast.success("Buku berhasil dikembalikan");
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal mengembalikan buku"
      );
    } finally {
      setReturningId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Peminjaman"
        description="Catat dan kelola peminjaman buku oleh siswa."
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Tambah Peminjaman
          </Button>
        }
      />

      <Card className="gap-0 py-0">
        <CardContent className="px-0 py-0">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Cari kode, buku, atau siswa…"
              className="w-full sm:max-w-sm"
            />
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as "all" | LoanStatus)
              }
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                <SelectItem value="borrowed">Dipinjam</SelectItem>
                <SelectItem value="overdue">Terlambat</SelectItem>
                <SelectItem value="returned">Dikembalikan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!loans ? (
            <div className="p-4">
              <TableSkeleton rows={6} columns={4} />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={ArrowLeftRight}
              title="Tidak ada data"
              description="Tidak ditemukan peminjaman yang sesuai. Buat peminjaman baru untuk memulai."
              action={
                <Button size="sm" onClick={openCreate}>
                  <Plus className="size-4" />
                  Tambah Peminjaman
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Buku</TableHead>
                  <TableHead>Siswa</TableHead>
                  <TableHead>Dipinjam</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((loan) => {
                  const isActive =
                    loan.status === "borrowed" || loan.status === "overdue";
                  return (
                    <TableRow key={loan.id}>
                      <TableCell>
                        <span className="font-mono text-xs font-medium">
                          {loan.id}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="max-w-48 truncate font-medium">
                          {loan.bookTitle}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {loan.bookAuthor}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{loan.studentName}</p>
                        <p className="text-muted-foreground text-xs">
                          {loan.className || "-"}
                        </p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(loan.borrowedAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(loan.dueAt)}
                        {loan.fineAmount ? (
                          <span className="text-destructive block text-xs">
                            Denda {formatCurrency(loan.fineAmount)}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <LoanStatusBadge status={loan.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {isActive ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReturn(loan.id)}
                            disabled={returningId === loan.id}
                          >
                            <Undo2 className="size-4" />
                            {returningId === loan.id
                              ? "Memproses…"
                              : "Kembalikan"}
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            -
                          </span>
                        )}
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
          if (!saving) setDialogOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Peminjaman</DialogTitle>
            <DialogDescription>
              Catat peminjaman buku oleh siswa.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Buku</Label>
              <Select
                value={form.bookId}
                onValueChange={(value) =>
                  setForm({ ...form, bookId: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih buku" />
                </SelectTrigger>
                <SelectContent>
                  {availableBooks.length === 0 ? (
                    <p className="px-2 py-1.5 text-sm text-muted-foreground">
                      Tidak ada buku tersedia
                    </p>
                  ) : (
                    availableBooks.map((book) => (
                      <SelectItem key={book.id} value={book.id}>
                        {book.title} · {book.availableCopies} tersedia
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Siswa</Label>
              <Select
                value={form.studentId}
                onValueChange={(value) =>
                  setForm({ ...form, studentId: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih siswa" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.uid} value={student.uid}>
                      {student.name}
                      {student.className ? ` · ${student.className}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Durasi (hari)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                value={form.durationDays}
                onChange={(e) =>
                  setForm({ ...form, durationDays: e.target.value })
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
                {saving ? "Menyimpan…" : "Simpan Peminjaman"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
