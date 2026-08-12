"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  CalendarCheck,
  CalendarPlus,
  Check,
  ChevronLeft,
  Eye,
  LayoutDashboard,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-screen";
import { ExportButton } from "@/components/shared/export-button";
import { AttendanceMarking } from "@/components/attendance/attendance-marking";
import { SuperAdminAttendanceAnalytics } from "@/components/attendance/superadmin-attendance-analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/format";
import { CLASS_OPTIONS } from "@/lib/constants";
import {
  createAttendanceSession,
  deleteAttendanceSession,
  getAdminAttendanceOverview,
  getAttendanceRecap,
  getAttendanceSessions,
  updateAttendanceSession,
} from "@/services/attendance-service";
import type { AdminAttendanceOverview } from "@/services/attendance-service";
import { subscribe } from "@/services/realtime-service";
import type { DataChangedPayload } from "@/services/realtime-service";
import type {
  AttendanceRecapRow,
  AttendanceSessionRecord,
} from "@/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 8;

export function AttendanceManagement({ mode }: { mode: "admin" | "superadmin" }) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"sessions" | "recap" | "analitik">("sessions");
  const [sessions, setSessions] = useState<AttendanceSessionRecord[] | null>(null);
  const [recap, setRecap] = useState<AttendanceRecapRow[]>([]);
  const [overview, setOverview] = useState<AdminAttendanceOverview | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<AttendanceSessionRecord | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AttendanceSessionRecord | null>(null);
  const [formDate, setFormDate] = useState("");
  const [formClass, setFormClass] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<AttendanceSessionRecord | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const teacherId = mode === "admin" ? user.uid : undefined;
    const [sessionList, recapRows, todayOverview] = await Promise.all([
      getAttendanceSessions(teacherId),
      getAttendanceRecap(),
      getAdminAttendanceOverview(teacherId),
    ]);
    setSessions(sessionList);
    setRecap(recapRows);
    setOverview(todayOverview);
  }, [user, mode]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const unsubscribe = subscribe<DataChangedPayload>("data-changed", (event) => {
      if (event.payload?.scope === "attendance") void load();
    });
    return unsubscribe;
  }, [load]);

  useEffect(() => {
    if (tab === "recap" && recap.length === 0) {
      void load();
    }
  }, [tab, recap.length, load]);

  const filtered = useMemo(() => {
    if (!sessions) return [];
    const q = query.trim().toLowerCase();
    return sessions.filter((session) => {
      const matchStatus =
        statusFilter === "all" || session.status === statusFilter;
      if (!q) return matchStatus;
      return (
        matchStatus &&
        (session.className.toLowerCase().includes(q) ||
          session.teacherName.toLowerCase().includes(q))
      );
    });
  }, [sessions, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function openCreate() {
    setEditing(null);
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormClass("");
    setDialogOpen(true);
  }

  function openEdit(session: AttendanceSessionRecord) {
    setEditing(session);
    setFormDate(session.date.slice(0, 10));
    setFormClass(session.className);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!formDate || !formClass) {
      toast.error("Tanggal dan kelas wajib diisi");
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      if (editing) {
        await updateAttendanceSession(editing.id, {
          date: new Date(formDate).toISOString(),
          className: formClass,
        });
        toast.success("Absensi diperbarui");
      } else {
        await createAttendanceSession({
          date: new Date(formDate).toISOString(),
          className: formClass,
          teacherId: user.uid,
        });
        toast.success("Absensi baru dibuat");
      }
      setDialogOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      await deleteAttendanceSession(deleting.id);
      toast.success("Absensi dihapus");
      setDeleting(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus");
    } finally {
      setDeletingBusy(false);
    }
  }

  if (!sessions) return <PageLoader />;

  if (viewing) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setViewing(null)}
          className="-ml-2"
        >
          <ChevronLeft className="size-4" />
          Kembali ke daftar
        </Button>
        <AttendanceMarking session={viewing} onChanged={load} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Absensi"
        description="Buat sesi absensi dan catat kehadiran siswa per kelas."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {tab === "recap" ? (
              <ExportButton
                filename="rekap-absensi"
                title="Rekap Absensi per Kelas"
                disabled={recap.length === 0}
                columns={[
                  { header: "Kelas", value: "Kelas" },
                  { header: "Sesi", value: "Sesi" },
                  { header: "Hadir", value: "Hadir" },
                  { header: "Terlambat", value: "Terlambat" },
                  { header: "Izin", value: "Izin" },
                  { header: "Sakit", value: "Sakit" },
                  { header: "Alpha", value: "Alpha" },
                  { header: "Total", value: "Total" },
                  { header: "Kehadiran", value: "Kehadiran (%)" },
                ]}
                rows={recap.map((row) => [
                  row.className,
                  String(row.sessions),
                  String(row.present),
                  String(row.late),
                  String(row.permission),
                  String(row.sick),
                  String(row.absent),
                  String(row.total),
                  String(row.attendanceRate),
                ])}
              />
            ) : (
              <ExportButton
                filename="sesi-absensi"
                title="Sesi Absensi"
                disabled={filtered.length === 0}
                columns={[
                  { header: "Tanggal", value: "Tanggal" },
                  { header: "Kelas", value: "Kelas" },
                  { header: "Guru", value: "Guru" },
                  { header: "Hadir", value: "Hadir" },
                  { header: "Terlambat", value: "Terlambat" },
                  { header: "Izin", value: "Izin" },
                  { header: "Sakit", value: "Sakit" },
                  { header: "Alpha", value: "Alpha" },
                  { header: "Status", value: "Status" },
                ]}
                rows={filtered.map((session) => [
                  formatDate(session.date),
                  session.className,
                  session.teacherName,
                  String(session.presentCount),
                  String(session.lateCount),
                  String(session.permissionCount),
                  String(session.sickCount),
                  String(session.absentCount),
                  session.status === "open" ? "Terbuka" : "Ditutup",
                ])}
              />
            )}
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Buat Absensi
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-1">
        <button
          type="button"
          onClick={() => setTab("sessions")}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            tab === "sessions"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          <CalendarCheck className="size-4" />
          Sesi Absensi
        </button>
        <button
          type="button"
          onClick={() => setTab("recap")}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            tab === "recap"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          <Users className="size-4" />
          Rekap Kelas
        </button>
        {mode === "superadmin" && (
          <button
            type="button"
            onClick={() => setTab("analitik")}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              tab === "analitik"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <LayoutDashboard className="size-4" />
            Analitik Sekolah
          </button>
        )}
      </div>

      {tab === "analitik" ? (
        <SuperAdminAttendanceAnalytics />
      ) : overview && tab === "sessions" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {[
              { label: "Hadir", value: overview.present, className: "text-success" },
              { label: "Terlambat", value: overview.late, className: "text-amber-500" },
              { label: "Izin", value: overview.permission, className: "text-primary" },
              { label: "Sakit", value: overview.sick, className: "text-warning" },
              { label: "Alpha", value: overview.absent, className: "text-destructive" },
              { label: "Belum tercatat", value: overview.notMarked, className: "text-muted-foreground" },
              { label: "Kehadiran", value: overview.presentRate, className: "text-foreground", suffix: "%" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border bg-card px-4 py-3">
                <p className="text-muted-foreground text-xs">{item.label}</p>
                <p className={cn("text-2xl font-semibold", item.className)}>
                  {item.value}
                  {"suffix" in item && item.suffix}
                </p>
              </div>
            ))}
          </div>

          {overview.absentStudents.length > 0 && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="flex flex-wrap items-center gap-2 py-3 text-sm">
                <AlertCircle className="size-4 shrink-0 text-amber-500" />
                <span className="font-medium">
                  Belum absen hari ini ({overview.absentStudents.length}):
                </span>
                {overview.absentStudents.slice(0, 8).map((student) => (
                  <Badge key={student.id} variant="secondary">
                    {student.studentName}
                  </Badge>
                ))}
                {overview.absentStudents.length > 8 && (
                  <Badge variant="outline">
                    +{overview.absentStudents.length - 8} lainnya
                  </Badge>
                )}
              </CardContent>
            </Card>
          )}
        </>
      ) : null}

      {tab === "sessions" ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Cari kelas atau guru…"
              className="w-full sm:max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                <SelectItem value="open">Terbuka</SelectItem>
                <SelectItem value="closed">Ditutup</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {rows.length === 0 ? (
            <Card>
              <CardContent>
                <EmptyState
                  icon={CalendarCheck}
                  title={query ? "Tidak ada hasil" : "Belum ada sesi absensi"}
                  description={
                    query
                      ? `Tidak ditemukan sesi yang cocok dengan "${query}".`
                      : "Klik Buat Absensi untuk memulai pencatatan kehadiran."
                  }
                  action={
                    !query && (
                      <Button size="sm" onClick={openCreate}>
                        <CalendarPlus className="size-4" />
                        Buat Absensi
                      </Button>
                    )
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
                      <TableHead>Guru</TableHead>
                      <TableHead className="text-center">Hadir</TableHead>
                      <TableHead className="text-center">Terlambat</TableHead>
                      <TableHead className="text-center">Izin</TableHead>
                      <TableHead className="text-center">Sakit</TableHead>
                      <TableHead className="text-center">Alpha</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">
                          {formatDate(session.date)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{session.className}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {session.teacherName}
                        </TableCell>
                        <TableCell className="text-center text-success">
                          {session.presentCount}
                        </TableCell>
                        <TableCell className="text-center text-amber-500">
                          {session.lateCount}
                        </TableCell>
                        <TableCell className="text-center text-primary">
                          {session.permissionCount}
                        </TableCell>
                        <TableCell className="text-center text-warning">
                          {session.sickCount}
                        </TableCell>
                        <TableCell className="text-center text-destructive">
                          {session.absentCount}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              session.status === "open" ? "successSoft" : "warningSoft"
                            }
                          >
                            {session.status === "open" ? "Terbuka" : "Ditutup"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Aksi
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewing(session)}>
                                <Eye className="size-4" />
                                Buka / Isi
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(session)}>
                                <Pencil className="size-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleting(session)}
                              >
                                <Trash2 className="size-4" />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
      ) : tab === "recap" ? (
        <Card className="gap-0 py-0">
          <CardContent className="px-0 py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kelas</TableHead>
                  <TableHead className="text-center">Sesi</TableHead>
                  <TableHead className="text-center">Hadir</TableHead>
                  <TableHead className="text-center">Terlambat</TableHead>
                  <TableHead className="text-center">Izin</TableHead>
                  <TableHead className="text-center">Sakit</TableHead>
                  <TableHead className="text-center">Alpha</TableHead>
                  <TableHead className="text-center">Total Catatan</TableHead>
                  <TableHead className="text-right">Kehadiran</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recap.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-muted-foreground text-center"
                    >
                      Belum ada data rekap.
                    </TableCell>
                  </TableRow>
                ) : (
                  recap.map((row) => (
                    <TableRow key={row.className}>
                      <TableCell className="font-medium">
                        {row.className}
                      </TableCell>
                      <TableCell className="text-center">
                        {row.sessions}
                      </TableCell>
                      <TableCell className="text-center text-success">
                        {row.present}
                      </TableCell>
                      <TableCell className="text-center text-amber-500">
                        {row.late}
                      </TableCell>
                      <TableCell className="text-center text-primary">
                        {row.permission}
                      </TableCell>
                      <TableCell className="text-center text-warning">
                        {row.sick}
                      </TableCell>
                      <TableCell className="text-center text-destructive">
                        {row.absent}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {row.total}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm font-medium">
                            {row.attendanceRate}%
                          </span>
                          <div className="bg-muted h-2 w-24 overflow-hidden rounded-full">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                row.attendanceRate >= 90
                                  ? "bg-success"
                                  : row.attendanceRate >= 75
                                    ? "bg-warning"
                                    : "bg-destructive"
                              )}
                              style={{ width: `${row.attendanceRate}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!saving) setDialogOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Absensi" : "Buat Absensi Baru"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Ubah tanggal dan kelas sesi absensi."
                : "Buat sesi absensi baru untuk satu kelas."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="attendance-date">Tanggal</Label>
              <Input
                id="attendance-date"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Kelas</Label>
              <Select value={formClass} onValueChange={setFormClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_OPTIONS.map((className) => (
                    <SelectItem key={className} value={className}>
                      {className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!editing && (
              <p className="text-muted-foreground text-xs">
                Semua siswa di kelas tersebut akan ditambahkan dengan status
                Alpha dan siap diisi.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan…" : editing ? "Simpan" : "Buat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!deletingBusy) setDeleting(open ? deleting : null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Absensi?</DialogTitle>
            <DialogDescription>
              Absensi{" "}
              <span className="font-medium text-foreground">
                {deleting?.className} · {deleting ? formatDate(deleting.date) : ""}
              </span>{" "}
              beserta seluruh catatan kehadirannya akan dihapus permanen.
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleting(null)}
              disabled={deletingBusy}
            >
              <X className="size-4" />
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deletingBusy}
            >
              <Check className="size-4" />
              {deletingBusy ? "Menghapus…" : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
