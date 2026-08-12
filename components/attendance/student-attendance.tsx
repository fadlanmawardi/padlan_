"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  Clock3,
  LayoutGrid,
  List,
  Percent,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-screen";
import { AttendanceStatusBadge } from "@/components/shared/status-badges";
import { StatCard } from "@/components/shared/stat-card";
import { AttendanceCheckIn } from "@/components/attendance/attendance-check-in";
import { StudentAttendanceInsights } from "@/components/attendance/student-attendance-insights";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import { getStudentAttendance } from "@/services/attendance-service";
import { subscribe } from "@/services/realtime-service";
import type { DataChangedPayload } from "@/services/realtime-service";
import type { StudentAttendanceSummary } from "@/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

export function StudentAttendance() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"riwayat" | "insight">("riwayat");
  const [data, setData] = useState<StudentAttendanceSummary | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    if (!user) return;
    setData(await getStudentAttendance(user.uid));
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const unsubscribe = subscribe<DataChangedPayload>("data-changed", (event) => {
      if (event.payload?.scope === "attendance") void load();
    });
    return unsubscribe;
  }, [load]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.records.filter((record) => {
      const matchStatus =
        statusFilter === "all" || record.status === statusFilter;
      if (!q) return matchStatus;
      return (
        matchStatus &&
        (record.sessionClassName.toLowerCase().includes(q) ||
          formatDate(record.sessionDate).toLowerCase().includes(q))
      );
    });
  }, [data, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  if (!data) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Absensi Saya"
        description="Absen setiap sesi, pantau kehadiran, dan lihat statistik personalmu."
      />

      <AttendanceCheckIn />

      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-1">
        <button
          type="button"
          onClick={() => setTab("riwayat")}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            tab === "riwayat"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          <List className="size-4" />
          Riwayat & Statistik
        </button>
        <button
          type="button"
          onClick={() => setTab("insight")}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            tab === "insight"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          <LayoutGrid className="size-4" />
          Insight & Achievement
        </button>
      </div>

      {tab === "insight" ? (
        <StudentAttendanceInsights />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Sesi"
              value={data.totalSessions}
              change="Sepanjang waktu"
              trend="flat"
              icon={CalendarCheck}
            />
            <StatCard
              label="Hadir"
              value={data.present}
              change="Kehadiran"
              trend="up"
              icon={CheckCircle2}
            />
            <StatCard
              label="Izin & Sakit"
              value={data.permission + data.sick}
              change="Dengan keterangan"
              trend="flat"
              icon={Clock3}
            />
            <StatCard
              label="Persentase"
              value={data.percentage}
              valueFormatter={(value) => `${value}%`}
              change={
                data.absent > 0 ? `${data.absent} kali alpha` : "Tanpa alpha"
              }
              trend={
                data.percentage >= 90
                  ? "up"
                  : data.percentage >= 75
                    ? "flat"
                    : "down"
              }
              icon={Percent}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Cari kelas atau tanggal…"
              className="w-full sm:max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                <SelectItem value="present">Hadir</SelectItem>
                <SelectItem value="late">Terlambat</SelectItem>
                <SelectItem value="permission">Izin</SelectItem>
                <SelectItem value="sick">Sakit</SelectItem>
                <SelectItem value="absent">Alpha</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {rows.length === 0 ? (
            <Card>
              <CardContent>
                <EmptyState
                  icon={XCircle}
                  title={query ? "Tidak ada hasil" : "Belum ada riwayat"}
                  description={
                    query
                      ? `Tidak ditemukan catatan yang cocok dengan "${query}".`
                      : "Riwayat kehadiran akan tampil setelah guru membuat sesi absensi."
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="gap-0 py-0">
              <CardContent className="px-0 py-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {formatDate(record.sessionDate)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {record.sessionClassName}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <AttendanceStatusBadge status={record.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.checkIn || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.note || record.teacherNote || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Pagination
            page={currentPage}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
