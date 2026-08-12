"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarRange, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-screen";
import {
  MiniCalendar,
  type CalendarEventItem,
} from "@/components/shared/mini-calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { CLASS_OPTIONS } from "@/lib/constants";
import { dateKey, todayKey } from "@/lib/academics";
import { formatDate } from "@/lib/format";
import {
  ACADEMIC_EVENT_META,
  createAcademicEvent,
  deleteAcademicEvent,
  getAcademicEvents,
  updateAcademicEvent,
} from "@/services/academic-service";
import type { AcademicEvent, AcademicEventType } from "@/types";

const EVENT_TYPES = Object.keys(ACADEMIC_EVENT_META) as AcademicEventType[];

interface EventForm {
  title: string;
  type: AcademicEventType;
  date: string;
  startTime: string;
  endTime: string;
  className: string;
  description: string;
}

const EMPTY_FORM: EventForm = {
  title: "",
  type: "event",
  date: todayKey(),
  startTime: "08:00",
  endTime: "10:00",
  className: "",
  description: "",
};

export function AcademicCalendar() {
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  const [events, setEvents] = useState<AcademicEvent[] | null>(null);
  const [selected, setSelected] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AcademicEvent | null>(null);
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AcademicEvent | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const list = await getAcademicEvents();
    setEvents(list);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const calendarEvents = useMemo<CalendarEventItem[]>(
    () =>
      (events ?? []).map((event) => ({
        date: event.date,
        type: event.type,
        color: ACADEMIC_EVENT_META[event.type].color,
        title: event.title,
      })),
    [events]
  );

  const selectedKey = dateKey(selected);
  const selectedEvents = useMemo(
    () =>
      (events ?? [])
        .filter((event) => event.date === selectedKey)
        .sort((a, b) => (a.startTime ?? "00:00").localeCompare(b.startTime ?? "00:00")),
    [events, selectedKey]
  );

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, date: selectedKey });
    setDialogOpen(true);
  }

  function openEdit(event: AcademicEvent) {
    setEditing(event);
    setForm({
      title: event.title,
      type: event.type,
      date: event.date,
      startTime: event.startTime ?? "08:00",
      endTime: event.endTime ?? "10:00",
      className: event.className ?? "",
      description: event.description ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error("Judul wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        type: form.type,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        className: form.className || undefined,
        description: form.description.trim() || undefined,
      };
      if (editing) {
        await updateAcademicEvent(editing.id, payload);
        toast.success("Event diperbarui");
      } else {
        await createAcademicEvent(payload);
        toast.success("Event ditambahkan");
      }
      setDialogOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan event");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAcademicEvent(deleteTarget.id);
      toast.success("Event dihapus");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus event");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  if (!events) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kalender Akademik"
        description="Pantau semua kegiatan, ujian, libur, dan deadline."
        actions={
          !isStudent && (
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Tambah Event
            </Button>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <MiniCalendar
              events={calendarEvents}
              onSelect={setSelected}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CalendarRange className="size-4" />
              Event pada {formatDate(selected)}
            </CardTitle>
            {!isStudent && (
              <Button variant="outline" size="sm" onClick={openCreate}>
                <Plus className="size-4" />
                Tambah
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {selectedEvents.length === 0 ? (
              <EmptyState
                icon={CalendarRange}
                title="Tidak ada event"
                description="Tidak ada kegiatan pada tanggal ini."
              />
            ) : (
              <ul className="space-y-2">
                {selectedEvents.map((event) => {
                  const meta = ACADEMIC_EVENT_META[event.type];
                  return (
                    <li
                      key={event.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: meta.color }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {event.title}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            <span style={{ color: meta.color }}>
                              {meta.label}
                            </span>
                            {event.startTime && ` · ${event.startTime}–${event.endTime ?? ""}`}
                            {event.className && ` · ${event.className}`}
                          </p>
                          {event.description && (
                            <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {!isStudent && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(event)}
                            aria-label="Edit"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setDeleteTarget(event)}
                            aria-label="Hapus"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {!isStudent && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ringkasan Event</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {EVENT_TYPES.map((type) => {
              const meta = ACADEMIC_EVENT_META[type];
              const count = events.filter((e) => e.type === type).length;
              return (
                <Badge
                  key={type}
                  variant="outline"
                  className="gap-1.5"
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  {meta.label}: {count}
                </Badge>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Event" : "Tambah Event"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Judul</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Misal: Pembagian Rapor"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Jenis</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      type: value as AcademicEventType,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {ACADEMIC_EVENT_META[type].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, date: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Mulai</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, startTime: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Selesai</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, endTime: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Kelas</Label>
                <Select
                  value={form.className}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, className: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua</SelectItem>
                    {CLASS_OPTIONS.map((className) => (
                      <SelectItem key={className} value={className}>
                        {className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Hapus event"
        description={`Hapus "${deleteTarget?.title ?? ""}" dari kalender?`}
        confirmLabel="Hapus"
        loading={deleting}
        onOpenChange={(open) => {
          if (!deleting) setDeleteTarget(open ? deleteTarget : null);
        }}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
