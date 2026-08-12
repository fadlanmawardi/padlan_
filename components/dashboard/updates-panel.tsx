"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BellRing,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MiniCalendar } from "@/components/shared/mini-calendar";
import type { CalendarEventItem } from "@/components/shared/mini-calendar";
import { PageLoader } from "@/components/shared/loading-screen";
import { formatDate, relativeTime } from "@/lib/format";
import { dateKey } from "@/lib/academics";
import {
  getAcademicEvents,
  getUpcomingDeadlines,
  getUpcomingExams,
  ACADEMIC_EVENT_META,
} from "@/services/academic-service";
import { getAnnouncements } from "@/services/community-service";
import type { AcademicEvent, AnnouncementRecord } from "@/types";

interface UpdatesPanelProps {
  role: "student" | "admin" | "superadmin";
  className?: string;
}

export function UpdatesPanel({ role, className }: UpdatesPanelProps) {
  const [events, setEvents] = useState<AcademicEvent[] | null>(null);
  const [deadlines, setDeadlines] = useState<
    { id: string; title: string; subject: string; deadline: string }[]
  >([]);
  const [exams, setExams] = useState<
    { id: string; subjectName: string; date: string; color: string }[]
  >([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);

  const load = useCallback(async () => {
    const [academicEvents, upcoming, examList, announcementList] =
      await Promise.all([
        getAcademicEvents(),
        getUpcomingDeadlines(5, className),
        getUpcomingExams(5, className),
        getAnnouncements(),
      ]);
    setEvents(academicEvents);
    setDeadlines(upcoming);
    setExams(examList);
    setAnnouncements(announcementList.slice(0, 4));
  }, [className]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!events) return <PageLoader />;

  const calendarEvents: CalendarEventItem[] = events
    .filter((e) => e.date >= new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 10))
    .slice(0, 40)
    .map((e) => ({
      date: e.date,
      type: e.type,
      color: ACADEMIC_EVENT_META[e.type].color,
      title: e.title,
    }));

  const todayKey = dateKey(new Date());

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="size-4" />
            Agenda Mendatang
          </CardTitle>
          <CardDescription>
            Tugas, ujian, dan pengumuman terbaru.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                <ClipboardList className="text-muted-foreground size-3.5" />
                Deadline Tugas
              </p>
              {deadlines.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Tidak ada deadline terdekat.
                </p>
              ) : (
                deadlines.map((deadline) => (
                  <div key={deadline.id} className="flex items-start gap-3">
                    <span
                      className={
                        deadline.deadline.slice(0, 10) === todayKey
                          ? "bg-red-500/15 text-red-600 dark:text-red-400 flex size-9 shrink-0 flex-col items-center justify-center rounded-lg text-[10px] font-bold leading-none"
                          : "bg-primary/10 text-primary flex size-9 shrink-0 flex-col items-center justify-center rounded-lg text-[10px] font-bold leading-none"
                      }
                    >
                      {formatDate(deadline.deadline)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {deadline.title}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {deadline.subject}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div>
                <Button variant="link" asChild className="h-auto p-0 text-sm">
                  <Link href={`/${role}/assignments`}>Lihat semua tugas</Link>
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                <CalendarDays className="text-muted-foreground size-3.5" />
                Jadwal Ujian
              </p>
              {exams.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Tidak ada ujian mendatang.
                </p>
              ) : (
                exams.map((exam) => (
                  <div key={exam.id} className="flex items-start gap-3">
                    <span
                      className="flex size-9 shrink-0 flex-col items-center justify-center rounded-lg text-[10px] font-bold leading-none text-white"
                      style={{ backgroundColor: exam.color }}
                    >
                      {formatDate(exam.date)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {exam.subjectName}
                      </p>
                      <p className="text-muted-foreground text-xs">Ujian</p>
                    </div>
                  </div>
                ))
              )}
              <div>
                <Button variant="link" asChild className="h-auto p-0 text-sm">
                  <Link href={`/${role}/exams`}>Lihat semua ujian</Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Kalender</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniCalendar events={calendarEvents} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Megaphone className="text-primary size-4" />
              Pengumuman
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {announcements.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Belum ada pengumuman.
              </p>
            ) : (
              announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="rounded-lg border px-3 py-2.5"
                >
                  <p className="truncate text-sm font-medium">
                    {announcement.title}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {announcement.authorName} ·{" "}
                    {relativeTime(announcement.createdAt)}
                  </p>
                </div>
              ))
            )}
            <div>
              <Button variant="link" asChild className="h-auto p-0 text-sm">
                <Link href={`/${role}/announcements`}>
                  <BellRing className="size-3.5" />
                  Lihat semua
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
