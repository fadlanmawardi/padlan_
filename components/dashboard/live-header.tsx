"use client";

import { useCallback, useEffect, useState } from "react";
import { Flame, Sun } from "lucide-react";
import { DigitalClock } from "@/components/shared/digital-clock";
import { WeatherWidget } from "@/components/shared/weather-widget";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/components/auth/auth-provider";
import { getStreak } from "@/services/gamification-service";
import type { StreakData } from "@/types";

export function LiveHeader({ showStreak = false }: { showStreak?: boolean }) {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StreakData | null>(null);

  const load = useCallback(async () => {
    if (!showStreak || !user) return;
    setStreak(getStreak(user.uid));
  }, [showStreak, user]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="gap-0 py-0 xl:col-span-2">
        <CardContent className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
              <Sun className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium">
                {user
                  ? `Selamat datang kembali, ${user.name.split(" ")[0]}!`
                  : "Selamat datang kembali!"}
              </p>
              <p className="text-muted-foreground text-xs">
                {new Intl.DateTimeFormat("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }).format(new Date())}
              </p>
            </div>
          </div>
          <DigitalClock />
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardContent className="px-5 py-4">
          <WeatherWidget />
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardContent className="flex h-full flex-col justify-center px-5 py-4">
          {showStreak && streak ? (
            <div className="flex items-center gap-3">
              <div className="bg-orange-500/15 flex size-10 items-center justify-center rounded-full">
                <Flame
                  className={`size-5 ${streak.currentStreak > 0 ? "text-orange-500" : "text-muted-foreground"}`}
                />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Streak</p>
                <p className="text-sm font-semibold">
                  {streak.currentStreak > 0
                    ? `${streak.currentStreak} hari`
                    : "Mulai hari ini"}
                </p>
                <p className="text-muted-foreground text-xs">
                  Terpanjang {streak.longestStreak} hari
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/15 text-amber-500 flex size-10 items-center justify-center rounded-full">
                <Sun className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {new Intl.DateTimeFormat("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  }).format(new Date())}
                </p>
                <p className="text-muted-foreground text-xs">
                  Semangat bekerja!
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
