"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Award,
  CalendarDays,
  Flame,
  LineChart as LineChartIcon,
  Lightbulb,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { PageLoader } from "@/components/shared/loading-screen";
import { CircularProgress } from "@/components/shared/circular-progress";
import { Heatmap } from "@/components/shared/heatmap";
import { LineChart } from "@/components/shared/line-chart";
import { MiniCalendar } from "@/components/shared/mini-calendar";
import { StreakDisplay } from "@/components/shared/streak-display";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { getStudentAttendanceInsights } from "@/services/attendance-service";
import type { StudentAttendanceInsights } from "@/services/attendance-service";
import { cn } from "@/lib/utils";

const DAY_STATUS_COLORS: Record<string, string> = {
  present: "var(--success)",
  late: "#f59e0b",
  permission: "var(--primary)",
  sick: "#eab308",
  absent: "var(--destructive)",
};

const DAY_STATUS_LABELS: Record<string, string> = {
  present: "Hadir",
  late: "Terlambat",
  permission: "Izin",
  sick: "Sakit",
  absent: "Alpha",
};

const TONE_STYLES = {
  good: "border-success/30 bg-success/5 text-success",
  warn: "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400",
  bad: "border-destructive/30 bg-destructive/5 text-destructive",
};

export function StudentAttendanceInsights() {
  const { user } = useAuth();
  const [data, setData] = useState<StudentAttendanceInsights | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setData(await getStudentAttendanceInsights(user.uid));
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!data) return <PageLoader />;

  const chartData = data.chart.map((d) => ({
    label: d.label,
    value: d.present + d.late,
  }));

  const calendarEvents = data.calendarDays
    .filter((d) => d.status)
    .map((d) => ({
      date: d.date,
      type: d.status!,
      color: DAY_STATUS_COLORS[d.status!] ?? "var(--muted-foreground)",
      title: `${DAY_STATUS_LABELS[d.status!] ?? d.status}${d.checkIn ? ` ${d.checkIn}` : ""}`,
    }));

  const trendUp = data.monthRate >= data.lastMonthRate;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <StreakDisplay
          current={data.streak.current}
          longest={data.streak.longest}
          className="lg:col-span-2"
        />
        <Card className="gap-0 py-0">
          <CardContent className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-muted-foreground text-sm">Kehadiran bulan ini</p>
              <p className="text-2xl font-semibold tracking-tight">
                {data.monthRate}%
              </p>
              <p
                className={cn(
                  "flex items-center gap-1 text-xs",
                  trendUp ? "text-success" : "text-destructive"
                )}
              >
                {trendUp ? (
                  <TrendingUp className="size-3.5" />
                ) : (
                  <TrendingDown className="size-3.5" />
                )}
                {trendUp ? "naik" : "turun"} dari {data.lastMonthRate}% bulan lalu
              </p>
            </div>
            <CircularProgress value={data.monthRate} size={64} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="gap-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="size-4" />
              Kalender Kehadiran
            </CardTitle>
            <CardDescription>
              Warna menandakan status kehadiranmu setiap hari.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MiniCalendar events={calendarEvents} />
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              {Object.entries(DAY_STATUS_LABELS).map(([key, label]) => (
                <span key={key} className="flex items-center gap-1">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: DAY_STATUS_COLORS[key] }}
                  />
                  {label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <LineChartIcon className="size-4" />
              Tren Kehadiran
            </CardTitle>
            <CardDescription>
              Jumlah hadir + terlambat per bulan (6 bulan terakhir).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart data={chartData} color="var(--primary)" height={160} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Flame className="size-4" />
            Peta Kehadiran
          </CardTitle>
          <CardDescription>
            Semakin pekat warnanya, semakin baik kehadiranmu pada hari itu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Heatmap data={data.heatmap} weeks={12} emptyLabel="90 hari terakhir" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="size-4" />
            Insight Personal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.insights.map((insight, index) => (
            <div
              key={index}
              className={cn("rounded-lg border p-3 text-sm", TONE_STYLES[insight.tone])}
            >
              <p className="font-medium">{insight.title}</p>
              <p className="mt-0.5 text-xs opacity-90">{insight.message}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="size-4" />
            Achievement Absensi
          </CardTitle>
          <CardDescription>
            Capai target untuk membuka lencana berikutnya.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={cn(
                  "rounded-lg border p-4",
                  achievement.unlocked && "border-success/40 bg-success/5"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{achievement.icon}</span>
                    <div>
                      <p className="text-sm font-semibold">{achievement.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={achievement.unlocked ? "successSoft" : "secondary"}
                  >
                    {achievement.unlocked ? "Terbuka" : "Terkunci"}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        achievement.unlocked ? "bg-success" : "bg-primary"
                      )}
                      style={{ width: `${achievement.progress}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground text-[11px]">
                    {achievement.progress}/{achievement.goal}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {data.today && (
        <p className="text-muted-foreground text-center text-xs">
          Status hari ini: {DAY_STATUS_LABELS[data.today.status ?? "absent"]} ·{" "}
          {formatDate(data.today.date)}
        </p>
      )}
    </div>
  );
}
