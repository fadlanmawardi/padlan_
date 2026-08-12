"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { BookMarked, LibraryBig, Undo2 } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-screen";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate, daysUntil } from "@/lib/format";
import { getStudentLoans, returnLoan } from "@/services/loan-service";
import type { LoanRecord } from "@/types";

export function MyBooksPage() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<LoanRecord[] | null>(null);
  const [returningId, setReturningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const all = await getStudentLoans(user.uid);
    setLoans(all.filter((l) => l.status !== "returned"));
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

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

  if (!loans) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buku Saya"
        description="Buku yang sedang kamu pinjam."
      />

      {loans.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={BookMarked}
              title="Tidak ada buku yang dipinjam"
              description="Kamu belum meminjam buku. Yuk jelajahi koleksi perpustakaan."
              action={
                <Button asChild size="sm">
                  <Link href="/student/books">
                    <LibraryBig className="size-4" />
                    Cari Buku
                  </Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loans.map((loan) => {
            const days = daysUntil(loan.dueAt);
            const overdue = loan.status === "overdue" || days < 0;
            return (
              <Card key={loan.id} className="gap-0 py-0">
                <CardHeader className="flex flex-row items-start gap-4">
                  <div
                    className={
                      overdue
                        ? "bg-destructive/10 text-destructive flex size-12 shrink-0 items-center justify-center rounded-lg"
                        : "bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-lg"
                    }
                  >
                    <LibraryBig className="size-6" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <CardTitle className="line-clamp-2 text-base">
                      {loan.bookTitle}
                    </CardTitle>
                    <CardDescription className="line-clamp-1">
                      {loan.bookAuthor}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Dipinjam</span>
                      <span>{formatDate(loan.borrowedAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Jatuh Tempo</span>
                      <span>{formatDate(loan.dueAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    {overdue ? (
                      <Badge variant="dangerSoft">
                        Terlambat {Math.abs(days)} hari
                      </Badge>
                    ) : (
                      <Badge variant="infoSoft">
                        {days === 0
                          ? "Jatuh tempo hari ini"
                          : `${days} hari lagi`}
                      </Badge>
                    )}
                  </div>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleReturn(loan.id)}
                    disabled={returningId === loan.id}
                  >
                    <Undo2 className="size-4" />
                    {returningId === loan.id ? "Memproses…" : "Kembalikan Buku"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
