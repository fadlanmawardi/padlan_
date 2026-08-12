"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Medal,
  School,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageLoader } from "@/components/shared/loading-screen";
import { StatCard } from "@/components/shared/stat-card";
import { Heatmap } from "@/components/shared/heatmap";
import { LineChart } from "@/components/shared/line-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AttendanceStatusBadge } from "@/components/shared/status-badges";
import { formatDate } from "@/lib/format";
import {
  getAttendanceTimeline,
  getSchoolHeatmap,
  getSchoolMonthlyChart,
  getSchoolYearlyChart,
  getSuperAdminAttendanceAnalytics,
} from "@/services/attendance-service";
import type { AttendanceChartDatum, AttendanceStatus } from "@/types";
import { cn } from "@/lib/utils";

interface AnalyticsState {
  totalStudents: number;
  totalTeachers: number;
  totalSessions: number;
  totalRecords: number;
  present: number;
  late: number;
  permission: number;
  sick: number;
  absent: number;
  attendanceRate: number;
  bestClasses: { className: string; attendanceRate: number; present: number; total: number }[];
  worstClasses: { className: string; attendanceRate: number; present: number; total: number }[];
  bestStudents: { uid: string; name: string; className?: string; attendanceRate: number; present: number; late: number; total: number }[];
  worstStudents: { uid: string; name: string; className?: string; attendanceRate: number; present: number; late: number; total: number }[];
}

export function SuperAdminAttendanceAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsState | null>(null);
  const [monthly, setMonthly] = useState<AttendanceChartDatum[]>([]);
  const [yearly, setYearly] = useState<AttendanceChartDatum[]>([]);
  const [heatmap, setHeatmap] = useState<{ date: string; value: number }[]>([]);
  const [timeline, setTimeline] = useState<
    { id: string; studentName: string; status: AttendanceStatus; className: string; date: string; note?: string }[]
  >([]);

  const load = useCallback(async () => {
    const [a, m, y, h, t] = await Promise.all([
      getSuperAdminAttendanceAnalytics(),
      getSchoolMonthlyChart(),
      getSchoolYearlyChart(),
      getSchoolHeatmap(),
      getAttendanceTimeline(15),
    ]);
    setAnalytics(a);
    setMonthly(m);
    setYearly(y);
    setHeatmap(h);
    setTimeline(t);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!analytics) return <PageLoader />;

  const monthlyLine = monthly.map((d) => ({
    label: d.label,
    value: d.present + d.late,
  }));
  const yearlyLine = yearly.map((d) => ({
    label: d.label,
    value: d.present + d.late,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Siswa Aktif"
          value={analytics.totalStudents}
          change="Total siswa"
          trend="flat"
          icon={Users}
        />
        <StatCard
          label="Guru / Admin"
          value={analytics.totalTeachers}
          change="Total pengajar"
          trend="flat"
          icon={School}
        />
        <StatCard
          label="Sesi Absensi"
          value={analytics.totalSessions}
          change={`${analytics.totalRecords} catatan`}
          trend="flat"
          icon={CalendarCheck}
        />
        <StatCard
          label="Tingkat Kehadiran"
          value={analytics.attendanceRate}
          valueFormatter={(value) => `${value}%`}
          change="Rata-rata seluruh sekolah"
          trend={analytics.attendanceRate >= 90 ? "up" : "down"}
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="gap-1">
            <CardTitle className="text-base">Kehadiran Bulanan</CardTitle>
            <CardDescription>Hadir + terlambat per bulan.</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart data={monthlyLine} color="var(--primary)" height={150} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="gap-1">
            <CardTitle className="text-base">Kehadiran Tahunan</CardTitle>
            <CardDescription>Hadir + terlambat per tahun.</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart data={yearlyLine} color="var(--success)" height={150} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="gap-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="size-4" />
              Status Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
            {[
              { label: "Hadir", value: analytics.present, color: "text-success" },
              { label: "Terlambat", value: analytics.late, color: "text-amber-500" },
              { label: "Izin", value: analytics.permission, color: "text-primary" },
              { label: "Sakit", value: analytics.sick, color: "text-warning" },
              { label: "Alpha", value: analytics.absent, color: "text-destructive" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border p-3">
                <p className="text-muted-foreground text-xs">{item.label}</p>
                <p className={cn("text-2xl font-semibold", item.color)}>
                  {item.value}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="gap-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Medal className="size-4" />
              Peta Kehadiran Sekolah
            </CardTitle>
            <CardDescription>120 hari terakhir — kehadiran semua kelas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Heatmap data={heatmap} weeks={12} emptyLabel="Data kehadiran harian" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="gap-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Medal className="size-4" />
              Kelas Terbaik
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 py-0">
            <RankTable
              rows={analytics.bestClasses}
              extra={(row) => `${row.present}/${row.total} hadir`}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="gap-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4" />
              Kelas Perlu Perhatian
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 py-0">
            <RankTable
              rows={analytics.worstClasses}
              extra={(row) => `${row.present}/${row.total} hadir`}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="gap-1">
            <CardTitle className="text-base">Siswa dengan Kehadiran Terbaik</CardTitle>
          </CardHeader>
          <CardContent className="px-0 py-0">
            <StudentRankTable rows={analytics.bestStudents} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="gap-1">
            <CardTitle className="text-base">Siswa Perlu Perhatian</CardTitle>
          </CardHeader>
          <CardContent className="px-0 py-0">
            <StudentRankTable rows={analytics.worstStudents} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock3 className="size-4" />
            Aktivitas Absensi Terbaru
          </CardTitle>
          <CardDescription>Catatan perubahan kehadiran siswa terbaru.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Siswa</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead className="text-right">Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeline.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground text-center">
                    Belum ada aktivitas.
                  </TableCell>
                </TableRow>
              ) : (
                timeline.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {entry.studentName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{entry.className || "-"}</Badge>
                    </TableCell>
                    <TableCell>
                      <AttendanceStatusBadge status={entry.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.note || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right">
                      {formatDate(entry.date)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

interface RankRow {
  className: string;
  attendanceRate: number;
  present: number;
  total: number;
}

function RankTable({
  rows,
  extra,
}: {
  rows: RankRow[];
  extra: (row: RankRow) => string;
}) {
  if (rows.length === 0) {
    return (
      <div className="text-muted-foreground px-4 py-8 text-center text-sm">
        Belum ada data.
      </div>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Nama</TableHead>
          <TableHead className="text-right">Kehadiran</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={index}>
            <TableCell className="text-muted-foreground">
              {index + 1}
            </TableCell>
            <TableCell className="font-medium">
              {row.className}
              <span className="text-muted-foreground ml-2 text-xs">
                {extra(row)}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <span className="font-semibold">{row.attendanceRate}%</span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function StudentRankTable({
  rows,
}: {
  rows: { name: string; className?: string; attendanceRate: number; total: number }[];
}) {
  if (rows.length === 0) {
    return (
      <div className="text-muted-foreground px-4 py-8 text-center text-sm">
        Belum ada data.
      </div>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Siswa</TableHead>
          <TableHead className="text-right">Kehadiran</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={index}>
            <TableCell className="text-muted-foreground">{index + 1}</TableCell>
            <TableCell className="font-medium">
              {row.name}
              <span className="text-muted-foreground ml-2 text-xs">
                {row.className} · {row.total} sesi
              </span>
            </TableCell>
            <TableCell className="text-right">
              <span className="font-semibold">{row.attendanceRate}%</span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
