"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, HandCoins, Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { FineStatusBadge } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { getFines, payFine } from "@/services/fine-service";
import type { FineRecord, FineStatus } from "@/types";

const PAGE_SIZE = 8;

export function FineManagement() {
  const [fines, setFines] = useState<FineRecord[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | FineStatus>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [payingId, setPayingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setFines(await getFines());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    const list = fines ?? [];
    const unpaid = list
      .filter((f) => f.status === "unpaid")
      .reduce((sum, f) => sum + f.amount, 0);
    const collected = list
      .filter((f) => f.status === "paid")
      .reduce((sum, f) => sum + f.amount, 0);
    return { unpaid, collected, count: list.length };
  }, [fines]);

  const filtered = useMemo(() => {
    if (!fines) return [];
    const q = query.trim().toLowerCase();
    return fines.filter((fine) => {
      const matchStatus =
        statusFilter === "all" || fine.status === statusFilter;
      if (!q) return matchStatus;
      return (
        matchStatus &&
        (fine.studentName.toLowerCase().includes(q) ||
          fine.bookTitle.toLowerCase().includes(q) ||
          fine.id.toLowerCase().includes(q) ||
          fine.loanId.toLowerCase().includes(q))
      );
    });
  }, [fines, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  async function handlePay(fineId: string) {
    setPayingId(fineId);
    try {
      await payFine(fineId);
      toast.success("Denda berhasil dibayar");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memproses pembayaran");
    } finally {
      setPayingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Denda"
        description="Pantau dan proses pembayaran denda keterlambatan."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="gap-0 py-0">
          <CardContent className="flex items-center gap-4 px-5 py-4">
            <div className="bg-warning/15 text-warning flex size-11 items-center justify-center rounded-lg">
              <HandCoins className="size-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Total Denda</p>
              <p className="text-2xl font-semibold">
                {formatCurrency(totals.count === 0 ? 0 : totals.unpaid + totals.collected)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="gap-0 py-0">
          <CardContent className="flex items-center gap-4 px-5 py-4">
            <div className="bg-destructive/10 text-destructive flex size-11 items-center justify-center rounded-lg">
              <Wallet className="size-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Belum Dibayar</p>
              <p className="text-2xl font-semibold">
                {formatCurrency(totals.unpaid)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="gap-0 py-0">
          <CardContent className="flex items-center gap-4 px-5 py-4">
            <div className="bg-success/15 text-success flex size-11 items-center justify-center rounded-lg">
              <BadgeCheck className="size-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Sudah Dibayar</p>
              <p className="text-2xl font-semibold">
                {formatCurrency(totals.collected)}
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
              placeholder="Cari siswa, buku, atau kode denda…"
              className="w-full sm:max-w-sm"
            />
            <div className="flex items-center gap-3">
              <p className="text-muted-foreground text-sm">
                {filtered.length} denda
              </p>
              <div className="flex overflow-hidden rounded-md border text-sm">
                {(["all", "unpaid", "paid"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={
                      statusFilter === status
                        ? "bg-primary text-primary-foreground px-3 py-1.5 font-medium"
                        : "bg-card hover:bg-muted px-3 py-1.5"
                    }
                  >
                    {status === "all"
                      ? "Semua"
                      : status === "unpaid"
                        ? "Belum Dibayar"
                        : "Lunas"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {!fines ? (
            <div className="p-4">
              <TableSkeleton rows={6} columns={4} />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={HandCoins}
              title="Tidak ada data"
              description="Tidak ditemukan denda yang sesuai."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Siswa</TableHead>
                  <TableHead>Buku</TableHead>
                  <TableHead>Denda</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Diterbitkan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((fine) => (
                  <TableRow key={fine.id}>
                    <TableCell>
                      <span className="font-mono text-xs font-medium">
                        {fine.id}
                      </span>
                      <p className="text-muted-foreground text-xs">
                        {fine.loanId}
                      </p>
                    </TableCell>
                    <TableCell className="font-medium">
                      {fine.studentName}
                    </TableCell>
                    <TableCell>
                      <p className="max-w-48 truncate">{fine.bookTitle}</p>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(fine.amount)}
                    </TableCell>
                    <TableCell>
                      <FineStatusBadge status={fine.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(fine.issuedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {fine.status === "unpaid" ? (
                        <Button
                          size="sm"
                          onClick={() => handlePay(fine.id)}
                          disabled={payingId === fine.id}
                        >
                          <BadgeCheck className="size-4" />
                          {payingId === fine.id ? "Memproses…" : "Bayar"}
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          {formatDate(fine.paidAt)}
                        </span>
                      )}
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
    </div>
  );
}
