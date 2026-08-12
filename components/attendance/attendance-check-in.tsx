"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  Clock3,
  Loader2,
  LogIn,
  ShieldCheck,
  Timer,
  UserRoundCheck,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { AttendanceStatusBadge } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import {
  getActiveSessionForStudent,
  getRecordForSession,
  selfCheckIn,
} from "@/services/attendance-service";
import { subscribe } from "@/services/realtime-service";
import type { DataChangedPayload } from "@/services/realtime-service";
import type { AttendanceRecordView, AttendanceSessionRecord } from "@/types";
import { cn } from "@/lib/utils";

export function AttendanceCheckIn() {
  const { user } = useAuth();
  const [session, setSession] = useState<AttendanceSessionRecord | null>(null);
  const [record, setRecord] = useState<AttendanceRecordView | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"present" | "late" | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const active = await getActiveSessionForStudent(user.uid);
      setSession(active);
      if (active) {
        setRecord(await getRecordForSession(active.id, user.uid));
      } else {
        setRecord(null);
      }
    } finally {
      setLoading(false);
    }
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

  if (!user) return null;
  if (loading) {
    return (
      <Card>
        <CardContent className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Memeriksa sesi absensi…
        </CardContent>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card>
        <CardHeader className="gap-1">
          <div className="flex items-center gap-2">
            <div className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-full">
              <CalendarDays className="size-4" />
            </div>
            <CardTitle className="text-base">Absen Sekarang</CardTitle>
          </div>
          <CardDescription>
            Tidak ada sesi absensi yang terbuka untuk kelasmu hari ini.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const alreadyCheckedIn =
    record && record.status !== "absent";

  async function handleCheckIn(status: "present" | "late") {
    if (!user || !session) return;
    setBusy(status);
    try {
      const updated = await selfCheckIn(session.id, user.uid, status, note.trim() || undefined);
      setRecord((prev) => ({ ...(prev ?? ({} as AttendanceRecordView)), ...updated }));
      toast.success(
        status === "present"
          ? "Absensi berhasil dicatat. Selamat belajar! 🎉"
          : "Absensi tercatat sebagai terlambat."
      );
      setNote("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal absen");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="gap-0 py-0">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-full">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Absen Sekarang</p>
                <p className="text-muted-foreground text-xs">
                  {session.className} · {formatDate(session.date)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant="successSoft">Sesi Terbuka</Badge>
              <Badge variant="secondary">{session.teacherName}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock3 className="size-3.5" />
            {new Date().toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>

        {alreadyCheckedIn ? (
          <div
            className={cn(
              "mt-4 flex flex-wrap items-center gap-3 rounded-lg border p-4",
              record!.status === "late"
                ? "border-amber-500/30 bg-amber-500/5"
                : "border-success/30 bg-success/5"
            )}
          >
            <div className="text-success flex size-10 items-center justify-center rounded-full bg-white/60">
              <UserRoundCheck className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                Kamu sudah absen hari ini
              </p>
              <p className="text-muted-foreground text-xs">
                {record!.checkIn
                  ? `Tercatat pukul ${record!.checkIn}`
                  : "Kehadiranmu telah tercatat oleh guru."}
              </p>
              {record!.note && (
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Catatan: {record!.note}
                </p>
              )}
            </div>
            <AttendanceStatusBadge status={record!.status} />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <Timer className="size-3.5" />
              Tandai kehadiranmu sekarang sebelum sesi ditutup.
            </div>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan (opsional), mis. datang lebih awal…"
              rows={2}
              className="text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => void handleCheckIn("present")}
                disabled={busy !== null}
                className="min-w-32"
              >
                {busy === "present" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LogIn className="size-4" />
                )}
                Absen Hadir
              </Button>
              <Button
                variant="outline"
                onClick={() => void handleCheckIn("late")}
                disabled={busy !== null}
                className="min-w-36"
              >
                {busy === "late" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Clock3 className="size-4" />
                )}
                Terlambat
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
