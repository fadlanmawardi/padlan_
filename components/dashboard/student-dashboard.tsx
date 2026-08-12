"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeftRight,
  BookMarked,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileClock,
  HandCoins,
  History,
  LibraryBig,
  Undo2,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { LoanStatusBadge } from "@/components/shared/status-badges";
import { LiveHeader } from "@/components/dashboard/live-header";
import { UpdatesPanel } from "@/components/dashboard/updates-panel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/shared/loading-screen";
import { formatCurrency, formatDate, daysUntil } from "@/lib/format";
import {
  getStudentDashboard,
  getStudentTaskSummary,
} from "@/services/dashboard-service";
import { returnLoan } from "@/services/loan-service";
import type { StudentDashboardData, StudentTaskSummary } from "@/types";

export function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [tasks, setTasks] = useState<StudentTaskSummary | null>(null);
  const [returningId, setReturningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const [dashboard, taskSummary] = await Promise.all([
      getStudentDashboard(user.uid),
      getStudentTaskSummary(user.uid),
    ]);
    setData(dashboard);
    setTasks(taskSummary);
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
      toast.error(error instanceof Error ? error.message : "Gagal mengembalikan buku");
    } finally {
      setReturningId(null);
    }
  }

  if (!data) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Halo, ${user?.name.split(" ")[0] ?? "Siswa"}!`}
        description="Pantau peminjaman dan denda kamu di sini."
        actions={
          <Button asChild>
            <Link href="/student/books">
              <LibraryBig className="size-4" />
              Cari Buku
            </Link>
          </Button>
        }
      />

      <LiveHeader showStreak />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Buku Sedang Dipinjam"
          value={data.activeLoans.length}
          change="Aktif saat ini"
          trend="flat"
          icon={BookMarked}
        />
        <StatCard
          label="Total Peminjaman"
          value={data.totalLoans}
          change="Sepanjang waktu"
          trend="flat"
          icon={History}
        />
        <StatCard
          label="Denda Belum Dibayar"
          value={data.finesTotal}
          change="Segera bayar"
          trend={data.finesTotal > 0 ? "down" : "flat"}
          icon={HandCoins}
          valueFormatter={(value) => formatCurrency(value)}
        />
        <StatCard
          label="Buku Terlambat"
          value={data.overdueCount}
          change={data.overdueCount > 0 ? "Perlu tindakan" : "Aman"}
          trend={data.overdueCount > 0 ? "down" : "flat"}
          icon={AlertCircle}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Tugas"
          value={tasks?.totalAssignments ?? 0}
          change="Sepanjang waktu"
          trend="flat"
          icon={ClipboardList}
        />
        <StatCard
          label="Sudah Selesai"
          value={tasks?.completed ?? 0}
          change="Tepat waktu"
          trend="up"
          icon={CheckCircle2}
        />
        <StatCard
          label="Belum Selesai"
          value={tasks?.pending ?? 0}
          change={
            (tasks?.pending ?? 0) > 0 ? "Segera kerjakan" : "Aman"
          }
          trend={(tasks?.pending ?? 0) > 0 ? "flat" : "flat"}
          icon={FileClock}
        />
        <StatCard
          label="Deadline Hari Ini"
          value={tasks?.dueToday ?? 0}
          change={
            (tasks?.dueToday ?? 0) > 0 ? "Perlu tindakan" : "Tidak ada"
          }
          trend={(tasks?.dueToday ?? 0) > 0 ? "down" : "flat"}
          icon={CalendarClock}
        />
      </div>

      <UpdatesPanel role="student" className={user?.profile?.className} />

      {tasks && tasks.recent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ClipboardList className="size-4" />
              Tugas Terbaru
            </CardTitle>
            <CardDescription>Ringkasan tugas dari guru.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.recent.map((task) => {
              const days = daysUntil(task.deadline);
              const state = task.taskState;
              return (
                <div
                  key={task.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {task.subject} · {task.teacherName} ·{" "}
                      {formatDate(task.deadline)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.submission?.status === "submitted" &&
                      task.submission.grade !== undefined && (
                        <Badge variant="success" className="min-w-12 justify-center font-semibold">
                          {task.submission.grade}
                        </Badge>
                      )}
                    <Badge
                      variant={
                        state === "submitted"
                          ? "successSoft"
                          : state === "late"
                            ? "dangerSoft"
                            : days < 0
                              ? "dangerSoft"
                              : days <= 1
                                ? "warningSoft"
                                : "infoSoft"
                      }
                    >
                      {state === "submitted"
                        ? "Sudah dikumpulkan"
                        : state === "late"
                          ? "Terlambat"
                          : days < 0
                            ? `${Math.abs(days)} hari terlambat`
                            : days === 0
                              ? "Deadline hari ini"
                              : `Sisa ${days} hari`}
                    </Badge>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/student/assignments">Kerjakan</Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {data.upcomingDue.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CalendarClock className="text-warning size-4" />
              Notifikasi Jatuh Tempo
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {data.upcomingDue.map((loan) => {
              const days = daysUntil(loan.dueAt);
              const isOverdue = days < 0;
              return (
                <div
                  key={loan.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-card px-4 py-2.5 text-sm"
                >
                  <span className="font-medium">{loan.bookTitle}</span>
                  <Badge variant={isOverdue ? "dangerSoft" : "warningSoft"}>
                    {isOverdue
                      ? `Terlambat ${Math.abs(days)} hari`
                      : days === 0
                        ? "Jatuh tempo hari ini"
                        : `Sisa ${days} hari`}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Buku Saya</CardTitle>
            <CardDescription>Buku yang sedang kamu pinjam.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.activeLoans.length === 0 ? (
              <EmptyState
                icon={BookMarked}
                title="Tidak ada buku yang dipinjam"
                description="Kamu belum meminjam buku apa pun. Yuk jelajahi koleksi perpustakaan!"
                action={
                  <Button asChild size="sm">
                    <Link href="/student/books">Jelajahi Buku</Link>
                  </Button>
                }
              />
            ) : (
              <div className="space-y-2">
                {data.activeLoans.map((loan) => {
                  const days = daysUntil(loan.dueAt);
                  return (
                    <div
                      key={loan.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                          <LibraryBig className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {loan.bookTitle}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Jatuh tempo {formatDate(loan.dueAt)}
                            {loan.status === "overdue" && " · Terlambat"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            days < 0
                              ? "dangerSoft"
                              : days <= 2
                                ? "warningSoft"
                                : "infoSoft"
                          }
                        >
                          {days < 0
                            ? `${Math.abs(days)} hari terlambat`
                            : days === 0
                              ? "Hari ini"
                              : `${days} hari lagi`}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReturn(loan.id)}
                          disabled={returningId === loan.id}
                        >
                          <Undo2 className="size-4" />
                          {returningId === loan.id ? "Memproses…" : "Kembalikan"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Riwayat Terbaru</CardTitle>
            <CardDescription>Peminjaman terakhir kamu.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {data.recentLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {loan.bookTitle}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatDate(loan.borrowedAt)}
                    </p>
                  </div>
                  <LoanStatusBadge status={loan.status} />
                </div>
              ))}
            </div>
            <div className="mt-2">
              <Button variant="link" asChild className="h-auto p-0">
                <Link href="/student/history">
                  <History className="size-4" />
                  Lihat semua riwayat
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {data.activeLoans.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground">
          <ArrowLeftRight className="size-4 shrink-0" />
          Kembalikan buku sebelum jatuh tempo untuk menghindari denda
          keterlambatan.
        </div>
      )}
    </div>
  );
}
