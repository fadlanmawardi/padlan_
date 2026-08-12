"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, History } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-screen";
import { LoanStatusBadge, FineStatusBadge } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { getStudentLoans } from "@/services/loan-service";
import { getStudentFines, payFine } from "@/services/fine-service";
import type { Fine, LoanRecord } from "@/types";

export function HistoryPage() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<LoanRecord[] | null>(null);
  const [fines, setFines] = useState<Fine[] | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const [loanList, fineList] = await Promise.all([
      getStudentLoans(user.uid),
      getStudentFines(user.uid),
    ]);
    setLoans(loanList);
    setFines(fineList);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handlePay(fineId: string) {
    setPayingId(fineId);
    try {
      await payFine(fineId);
      toast.success("Denda berhasil dibayar");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membayar denda");
    } finally {
      setPayingId(null);
    }
  }

  if (!loans || !fines) return <PageLoader />;

  const unpaidTotal = fines
    .filter((f) => f.status === "unpaid")
    .reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riwayat Peminjaman"
        description="Riwayat lengkap peminjaman dan denda kamu."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Total Peminjaman</CardTitle>
            <CardDescription>Semua transaksi peminjaman kamu.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{loans.length}</p>
          </CardContent>
        </Card>
        <Card className={unpaidTotal > 0 ? "border-warning/30 bg-warning/5" : ""}>
          <CardHeader>
            <CardTitle>Total Denda</CardTitle>
            <CardDescription>Denda keterlambatan yang belum dibayar.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {formatCurrency(unpaidTotal)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Peminjaman</CardTitle>
          <CardDescription>Daftar buku yang pernah kamu pinjam.</CardDescription>
        </CardHeader>
        <CardContent>
          {loans.length === 0 ? (
            <EmptyState
              icon={History}
              title="Belum ada riwayat"
              description="Peminjaman buku yang kamu lakukan akan tercatat di sini."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Buku</TableHead>
                  <TableHead>Dipinjam</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Dikembalikan</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell>
                      <p className="max-w-56 truncate font-medium">
                        {loan.bookTitle}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {loan.bookAuthor}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(loan.borrowedAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(loan.dueAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {loan.returnedAt ? formatDate(loan.returnedAt) : "-"}
                    </TableCell>
                    <TableCell>
                      <LoanStatusBadge status={loan.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Denda Saya</CardTitle>
          <CardDescription>Daftar denda keterlambatan kamu.</CardDescription>
        </CardHeader>
        <CardContent>
          {fines.length === 0 ? (
            <EmptyState
              icon={BadgeCheck}
              title="Tidak ada denda"
              description="Kamu tidak memiliki denda. Pertahankan ya!"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Diterbitkan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fines.map((fine) => (
                  <TableRow key={fine.id}>
                    <TableCell>
                      <span className="font-mono text-xs">{fine.id}</span>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(fine.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(fine.issuedAt)}
                    </TableCell>
                    <TableCell>
                      <FineStatusBadge status={fine.status} />
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
                          {fine.paidAt ? formatDate(fine.paidAt) : "-"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
