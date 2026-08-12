"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeftRight,
  BookOpenCheck,
  CalendarCheck,
  ClipboardList,
  FileCheck2,
  FileX2,
  GraduationCap,
  HandCoins,
  LibraryBig,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { BarChart } from "@/components/shared/bar-chart";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { DistributionList } from "@/components/shared/distribution-list";
import { GroupedBarChart } from "@/components/shared/grouped-bar-chart";
import { LoanStatusBadge } from "@/components/shared/status-badges";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  getAdminTeachingStats,
  getCategoryDistribution,
  getDashboardStats,
  getLoanChartData,
  getRecentActivities,
} from "@/services/dashboard-service";
import { getLoans } from "@/services/loan-service";
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
  recentLoans: LoanRecord[];
  teachingStats: AdminTeachingStats;
}

export function SuperAdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  const load = useCallback(async () => {
    const [stats, chartData, categoryData, activities, loans, teachingStats] =
      await Promise.all([
        getDashboardStats(),
        getLoanChartData(),
        getCategoryDistribution(),
        getRecentActivities(8),
        getLoans(),
        getAdminTeachingStats(),
      ]);
    setData({
      stats,
      chartData,
      categoryData,
      activities,
      recentLoans: loans.slice(0, 6),
      teachingStats,
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!data) return <PageLoader />;

  const { stats, chartData, categoryData, activities, recentLoans, teachingStats } =
    data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Ringkasan aktivitas sekolah dan perpustakaan secara keseluruhan."
        actions={
          <Button asChild>
            <Link href="/super-admin/loans">
              <ArrowLeftRight className="size-4" />
              Kelola Peminjaman
            </Link>
          </Button>
        }
      />

      <LiveHeader />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
          label="Total Admin"
          value={stats.totalAdmins}
          change="Stabil"
          trend="flat"
          icon={ShieldCheck}
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
        <StatCard
          label="Total Denda"
          value={stats.totalFines}
          change={`${formatCurrency(stats.unpaidFines)} belum dibayar`}
          trend="up"
          icon={HandCoins}
          valueFormatter={(value) => formatCurrency(value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Tugas"
          value={teachingStats.totalAssignments}
          change="Seluruh guru"
          trend="flat"
          icon={ClipboardList}
        />
        <StatCard
          label="Sudah Dikumpulkan"
          value={teachingStats.submittedCount}
          change="Pengumpulan"
          trend="up"
          icon={FileCheck2}
        />
        <StatCard
          label="Belum Mengumpulkan"
          value={teachingStats.notSubmittedCount}
          change={
            teachingStats.notSubmittedCount > 0 ? "Perlu perhatian" : "Aman"
          }
          trend={teachingStats.notSubmittedCount > 0 ? "down" : "flat"}
          icon={FileX2}
        />
        <StatCard
          label="Hadir Hari Ini"
          value={teachingStats.attendanceTodayPresent}
          change={
            teachingStats.attendanceTodayTotal > 0
              ? `${Math.round(
                  (teachingStats.attendanceTodayPresent /
                    teachingStats.attendanceTodayTotal) *
                    100
                )}% kehadiran`
              : "Belum ada sesi"
          }
          trend="flat"
          icon={CalendarCheck}
        />
      </div>

      <UpdatesPanel role="superadmin" />

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
              data={teachingStats.submissionChart.map((d) => ({
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
              data={teachingStats.attendanceChart.map((d) => ({
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
            <CardTitle>Peminjaman Terbaru</CardTitle>
            <CardDescription>Transaksi peminjaman terbaru.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {recentLoans.map((loan) => (
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
                        {loan.studentName} · {formatDate(loan.borrowedAt)}
                      </p>
                    </div>
                  </div>
                  <LoanStatusBadge status={loan.status} />
                </div>
              ))}
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
            <div className="mt-2">
              <Button variant="link" asChild className="h-auto p-0">
                <Link href="/super-admin/reports">Lihat laporan lengkap</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {stats.unpaidFines > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex flex-wrap items-center gap-3 px-5 py-4">
            <div className="bg-warning/20 text-warning flex size-9 shrink-0 items-center justify-center rounded-lg">
              <Wallet className="size-4" />
            </div>
            <div className="flex-1 text-sm">
              Terdapat{" "}
              <Badge variant="warningSoft" className="font-semibold">
                {formatCurrency(stats.unpaidFines)}
              </Badge>{" "}
              denda yang belum dibayar. Segera tindak lanjuti pada halaman
              Denda.
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/super-admin/fines">Tinjau Denda</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
