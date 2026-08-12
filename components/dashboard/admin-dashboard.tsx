"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  BookOpenCheck,
  CalendarCheck,
  ClipboardList,
  FileCheck2,
  FileX2,
  GraduationCap,
  LibraryBig,
  Undo2,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { BarChart } from "@/components/shared/bar-chart";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { DistributionList } from "@/components/shared/distribution-list";
import { GroupedBarChart } from "@/components/shared/grouped-bar-chart";
import { PageLoader } from "@/components/shared/loading-screen";
import { LiveHeader } from "@/components/dashboard/live-header";
import { UpdatesPanel } from "@/components/dashboard/updates-panel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import {
  getAdminTeachingStats,
  getCategoryDistribution,
  getDashboardStats,
  getLoanChartData,
  getRecentActivities,
} from "@/services/dashboard-service";
import { getActiveLoans } from "@/services/loan-service";
import type {
  Activity,
  AdminTeachingStats,
  CategoryDatum,
  ChartDatum,
  DashboardStats,
  LoanRecord,
} from "@/types";

interface DashboardData {
  stats: DashboardStats;
  chartData: ChartDatum[];
  categoryData: CategoryDatum[];
  activities: Activity[];
  dueSoon: LoanRecord[];
  teaching: AdminTeachingStats;
}

export function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const [stats, chartData, categoryData, activities, activeLoans, teaching] =
      await Promise.all([
        getDashboardStats(),
        getLoanChartData(),
        getCategoryDistribution(),
        getRecentActivities(8),
        getActiveLoans(),
        getAdminTeachingStats(user.uid),
      ]);
    setData({
      stats,
      chartData,
      categoryData,
      activities,
      dueSoon: activeLoans.slice(0, 6),
      teaching,
    });
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!data) return <PageLoader />;

  const { stats, chartData, categoryData, activities, dueSoon, teaching } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Ringkasan aktivitas perpustakaan dan pengajaran."
        actions={
          <Button asChild>
            <Link href="/admin/loans">
              <ArrowLeftRight className="size-4" />
              Kelola Peminjaman
            </Link>
          </Button>
        }
      />

      <LiveHeader />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Buku"
          value={stats.totalBooks}
          change="Koleksi perpustakaan"
          trend="up"
          icon={LibraryBig}
        />
        <StatCard
          label="Total Siswa"
          value={stats.totalStudents}
          change="Siswa terdaftar"
          trend="up"
          icon={GraduationCap}
        />
        <StatCard
          label="Buku Dipinjam"
          value={stats.borrowedBooks}
          change={`${stats.overdueLoans} terlambat`}
          trend={stats.overdueLoans > 0 ? "down" : "flat"}
          icon={ArrowLeftRight}
        />
        <StatCard
          label="Buku Tersedia"
          value={stats.availableBooks}
          change="Siap dipinjam"
          trend="flat"
          icon={BookOpenCheck}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Tugas"
          value={teaching.totalAssignments}
          change="Sepanjang waktu"
          trend="flat"
          icon={ClipboardList}
        />
        <StatCard
          label="Sudah Dikumpulkan"
          value={teaching.submittedCount}
          change="Pengumpulan"
          trend="up"
          icon={FileCheck2}
        />
        <StatCard
          label="Belum Mengumpulkan"
          value={teaching.notSubmittedCount}
          change={
            teaching.notSubmittedCount > 0 ? "Perlu perhatian" : "Aman"
          }
          trend={teaching.notSubmittedCount > 0 ? "down" : "flat"}
          icon={FileX2}
        />
        <StatCard
          label="Hadir Hari Ini"
          value={teaching.attendanceTodayPresent}
          change={
            teaching.attendanceTodayTotal > 0
              ? `${Math.round(
                  (teaching.attendanceTodayPresent /
                    teaching.attendanceTodayTotal) *
                    100
                )}% kehadiran`
              : "Belum ada sesi"
          }
          trend="flat"
          icon={UserCheck}
        />
      </div>

      <UpdatesPanel role="admin" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck2 className="size-4" />
              Grafik Pengumpulan Tugas
            </CardTitle>
            <CardDescription>
              Status pengumpulan pada 6 tugas terbaru.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GroupedBarChart
              data={teaching.submissionChart.map((d) => ({
                label: d.label,
                series: [
                  {
                    name: "Dikumpulkan",
                    value: d.submitted,
                    className: "bg-success",
                  },
                  {
                    name: "Belum",
                    value: d.notCollected,
                    className: "bg-destructive/50",
                  },
                ],
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="size-4" />
              Grafik Kehadiran
            </CardTitle>
            <CardDescription>
              Kehadiran pada 6 sesi absensi terbaru.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GroupedBarChart
              data={teaching.attendanceChart.map((d) => ({
                label: d.label,
                series: [
                  {
                    name: "Hadir",
                    value: d.present,
                    className: "bg-success",
                  },
                  {
                    name: "Tidak Hadir",
                    value: d.absent,
                    className: "bg-warning",
                  },
                ],
              }))}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Grafik Peminjaman</CardTitle>
            <CardDescription>
              Peminjaman dan pengembalian 6 bulan terakhir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribusi Buku</CardTitle>
            <CardDescription>Jumlah buku per kategori.</CardDescription>
          </CardHeader>
          <CardContent>
            <DistributionList data={categoryData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Jatuh Tempo Terdekat</CardTitle>
            <CardDescription>Buku yang perlu segera dikembalikan.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {dueSoon.map((loan) => (
                <div
                  key={loan.id}
                  className="flex items-center justify-between gap-4 rounded-lg px-2 py-2.5 hover:bg-muted/60"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                      <LibraryBig className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {loan.bookTitle}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {loan.studentName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <p className="text-muted-foreground">Jatuh tempo</p>
                    <p className="font-medium">{formatDate(loan.dueAt)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2">
              <Button variant="link" asChild className="h-auto p-0">
                <Link href="/admin/returns">
                  <Undo2 className="size-4" />
                  Kelola pengembalian
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
            <CardDescription>Log aktivitas pengguna.</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityFeed activities={activities} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
