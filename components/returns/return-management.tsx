"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Undo2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate, daysUntil } from "@/lib/format";
import { getActiveLoans, returnLoan } from "@/services/loan-service";
import type { LoanRecord } from "@/types";

export function ReturnManagement() {
  const [loans, setLoans] = useState<LoanRecord[] | null>(null);
  const [query, setQuery] = useState("");
  const [returningId, setReturningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoans(await getActiveLoans());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!loans) return [];
    const q = query.trim().toLowerCase();
    if (!q) return loans;
    return loans.filter(
      (loan) =>
        loan.bookTitle.toLowerCase().includes(q) ||
        loan.studentName.toLowerCase().includes(q) ||
        loan.id.toLowerCase().includes(q)
    );
  }, [loans, query]);

  const overdueCount = useMemo(
    () => (loans ?? []).filter((l) => l.status === "overdue").length,
    [loans]
  );

  async function handleReturn(loan: LoanRecord) {
    setReturningId(loan.id);
    try {
      await returnLoan(loan.id);
      toast.success(
        loan.status === "overdue"
          ? "Buku dikembalikan, denda keterlambatan dibuat"
          : "Buku berhasil dikembalikan"
      );
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
        title="Kelola Pengembalian"
        description="Proses pengembalian buku yang sedang dipinjam."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="gap-0 py-0">
          <CardContent className="flex items-center gap-4 px-5 py-4">
            <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-lg">
              <Undo2 className="size-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Buku Dipinjam</p>
              <p className="text-2xl font-semibold">
                {(loans ?? []).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="gap-0 py-0">
          <CardContent className="flex items-center gap-4 px-5 py-4">
            <div className="bg-warning/15 text-warning flex size-11 items-center justify-center rounded-lg">
              <AlertCircle className="size-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Terlambat</p>
              <p className="text-2xl font-semibold">{overdueCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="gap-0 py-0">
          <CardContent className="flex items-center gap-4 px-5 py-4">
            <div className="bg-success/15 text-success flex size-11 items-center justify-center rounded-lg">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Tepat Waktu</p>
              <p className="text-2xl font-semibold">
                {(loans ?? []).filter((l) => l.status === "borrowed").length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="gap-0 py-0">
        <CardContent className="px-0 py-0">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Cari buku atau siswa…"
              className="w-full sm:max-w-sm"
            />
            <p className="text-muted-foreground text-sm">
              {filtered.length} peminjaman aktif
            </p>
          </div>

          {!loans ? (
            <div className="p-4">
              <TableSkeleton rows={6} columns={4} />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title={query ? "Tidak ada hasil" : "Tidak ada peminjaman aktif"}
              description={
                query
                  ? `Tidak ditemukan peminjaman yang cocok dengan "${query}".`
                  : "Semua buku telah dikembalikan. Tidak ada pengembalian yang perlu diproses."
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
                {filtered.map((loan) => {
                  const days = daysUntil(loan.dueAt);
                  const overdue = loan.status === "overdue" || days < 0;
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
                      </TableCell>
                      <TableCell>
                        {overdue ? (
                          <Badge variant="dangerSoft">
                            Terlambat {Math.abs(days)} hari
                          </Badge>
                        ) : (
                          <Badge variant="infoSoft">
                            {days === 0 ? "Hari ini" : `${days} hari lagi`}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleReturn(loan)}
                          disabled={returningId === loan.id}
                        >
                          <Undo2 className="size-4" />
                          {returningId === loan.id
                            ? "Memproses…"
                            : "Proses Kembali"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
