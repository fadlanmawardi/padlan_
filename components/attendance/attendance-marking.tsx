"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Lock,
  LockOpen,
  StickyNote,
  Users,
} from "lucide-react";
import { PageLoader } from "@/components/shared/loading-screen";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getInitials, formatDate } from "@/lib/format";
import {
  getSessionRecords,
  markAll,
  setSessionStatus,
  setStudentStatus,
} from "@/services/attendance-service";
import type {
  AttendanceRecordView,
  AttendanceSessionRecord,
  AttendanceStatus,
} from "@/types";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "present", label: "Hadir" },
  { value: "late", label: "Terlambat" },
  { value: "permission", label: "Izin" },
  { value: "sick", label: "Sakit" },
  { value: "absent", label: "Alpha" },
];

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: "data-[active=true]:bg-success data-[active=true]:text-white",
  late: "data-[active=true]:bg-amber-500 data-[active=true]:text-white",
  permission: "data-[active=true]:bg-primary data-[active=true]:text-white",
  sick: "data-[active=true]:bg-warning data-[active=true]:text-white",
  absent: "data-[active=true]:bg-destructive data-[active=true]:text-white",
};

export function AttendanceMarking({
  session,
  onChanged,
}: {
  session: AttendanceSessionRecord;
  onChanged?: () => void;
}) {
  const [records, setRecords] = useState<AttendanceRecordView[] | null>(null);
  const [current, setCurrent] = useState(session);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setRecords(await getSessionRecords(session.id));
  }, [session.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSetStatus(
    record: AttendanceRecordView,
    status: AttendanceStatus
  ) {
    if (record.status === status) return;
    setUpdatingId(record.id);
    try {
      await setStudentStatus(session.id, record.studentId, status);
      setRecords((prev) =>
        (prev ?? []).map((r) =>
          r.id === record.id ? { ...r, status } : r
        )
      );
      toast.success(`${record.studentName}: ${statusLabel(status)}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memperbarui absensi"
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleMarkAll(status: AttendanceStatus) {
    setBusy(true);
    try {
      await markAll(session.id, status);
      setRecords((prev) =>
        (prev ?? []).map((r) => ({ ...r, status, note: undefined }))
      );
      toast.success(`Semua siswa ditandai ${statusLabel(status)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menandai");
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleClose() {
    const next: "open" | "closed" =
      current.status === "open" ? "closed" : "open";
    try {
      const updated = await setSessionStatus(session.id, next);
      setCurrent(updated);
      toast.success(
        next === "closed"
          ? "Absensi ditutup"
          : "Absensi dibuka kembali"
      );
      onChanged?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengubah status");
    }
  }

  if (!records) return <PageLoader />;

  const counts = {
    present: records.filter((r) => r.status === "present").length,
    late: records.filter((r) => r.status === "late").length,
    permission: records.filter((r) => r.status === "permission").length,
    sick: records.filter((r) => r.status === "sick").length,
    absent: records.filter((r) => r.status === "absent").length,
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight">
            {formatDate(current.date)}
          </h2>
          <Badge variant="secondary">{current.className}</Badge>
          <Badge variant={current.status === "open" ? "successSoft" : "warningSoft"}>
            {current.status === "open" ? "Terbuka" : "Ditutup"}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Guru: {current.teacherName} · {records.length} siswa
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Hadir", value: counts.present, className: "text-success" },
          { label: "Terlambat", value: counts.late, className: "text-amber-500" },
          { label: "Izin", value: counts.permission, className: "text-primary" },
          { label: "Sakit", value: counts.sick, className: "text-warning" },
          { label: "Alpha", value: counts.absent, className: "text-destructive" },
          {
            label: "Sudah tercatat",
            value:
              records.length > 0
                ? Math.round(
                    ((counts.present +
                      counts.late +
                      counts.permission +
                      counts.sick +
                      counts.absent) /
                      records.length) *
                      100
                  )
                : 0,
            className: "text-foreground",
            suffix: "%",
          },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border bg-card px-3 py-2">
            <p className="text-muted-foreground text-[11px]">{item.label}</p>
            <p className={cn("text-xl font-semibold", item.className)}>
              {item.value}
              {"suffix" in item && item.suffix}
            </p>
          </div>
        ))}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-success transition-all"
          style={{
            width: `${Math.min(
              100,
              (counts.present + counts.late) / Math.max(1, records.length) * 100
            )}%`,
          }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant="outline"
              disabled={busy || current.status === "closed"}
              onClick={() => handleMarkAll(option.value)}
            >
              <Users className="size-4" />
              Semua {option.label} ({counts[option.value]})
            </Button>
          ))}
        </div>
        <Button
          size="sm"
          variant={current.status === "open" ? "outline" : "default"}
          onClick={handleToggleClose}
        >
          {current.status === "open" ? (
            <>
              <Lock className="size-4" />
              Tutup Absensi
            </>
          ) : (
            <>
              <LockOpen className="size-4" />
              Buka Kembali
            </>
          )}
        </Button>
      </div>

      <Card className="gap-0 py-0">
        <CardContent className="px-0 py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Siswa</TableHead>
                <TableHead>NIS</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-success/10 text-success text-xs font-semibold">
                          {getInitials(record.studentName)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="truncate text-sm font-medium">
                        {record.studentName}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {record.nis || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {STATUS_OPTIONS.map((option) => {
                        const active = record.status === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            disabled={
                              updatingId === record.id ||
                              current.status === "closed"
                            }
                            onClick={() =>
                              handleSetStatus(record, option.value)
                            }
                            data-active={active}
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60",
                              "hover:bg-muted",
                              active
                                ? "border-transparent"
                                : "bg-transparent text-muted-foreground",
                              STATUS_STYLES[option.value]
                            )}
                          >
                            {active && <Check className="mr-1 inline size-3" />}
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {record.note ? (
                      <span className="flex items-center gap-1.5 text-xs">
                        <StickyNote className="size-3.5" />
                        {record.note}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function statusLabel(status: AttendanceStatus): string {
  const option = STATUS_OPTIONS.find((o) => o.value === status);
  return option?.label ?? status;
}
