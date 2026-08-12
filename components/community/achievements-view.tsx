"use client";

import { useCallback, useEffect, useState } from "react";
import { Award, Crown, Lock, Sparkles, Trophy } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { PageLoader } from "@/components/shared/loading-screen";
import { AchievementCard } from "@/components/shared/achievement-card";
import { StreakDisplay } from "@/components/shared/streak-display";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth/auth-provider";
import { burstConfetti } from "@/lib/confetti";
import {
  getStudentAchievements,
  getStudentRank,
  getStreak,
  getTopStudentMetrics,
} from "@/services/gamification-service";
import type { AchievementDef } from "@/types";

export function AchievementsView() {
  const { user } = useAuth();
  const [unlocked, setUnlocked] = useState<AchievementDef[] | null>(null);
  const [locked, setLocked] = useState<AchievementDef[] | null>(null);
  const [xp, setXp] = useState(0);
  const [rank, setRank] = useState<{ rank: number; total: number } | null>(null);
  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0 });
  const [topXp, setTopXp] = useState(0);

  const load = useCallback(async () => {
    const studentId = user?.role === "student" ? user.uid : "u-s01";
    const [ach, rankData, streakData, top] = await Promise.all([
      getStudentAchievements(studentId),
      getStudentRank(studentId),
      getStreak(studentId),
      getTopStudentMetrics(),
    ]);
    setUnlocked(ach.unlocked);
    setLocked(ach.locked);
    setXp(ach.xp);
    setRank({ rank: rankData.rank, total: rankData.total });
    setStreak(streakData);
    setTopXp(top.xp);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (unlocked && unlocked.length > 0) {
      const timer = setTimeout(() => burstConfetti({ count: 60, spread: 60 }), 500);
      return () => clearTimeout(timer);
    }
  }, [unlocked]);

  if (!unlocked || !locked) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prestasi"
        description="Kumpulkan lencana dan tingkatkan XP-mu."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total XP"
          value={xp}
          change="XP yang terkumpul"
          trend="up"
          icon={Sparkles}
        />
        <StatCard
          label="Lencana Terbuka"
          value={unlocked.length}
          change={`dari ${unlocked.length + locked.length} total`}
          trend="up"
          icon={Trophy}
        />
        <StatCard
          label="Peringkat"
          value={rank?.rank ?? 0}
          change={`dari ${rank?.total ?? 0} siswa`}
          trend="up"
          icon={Award}
        />
        <StatCard
          label="XP Teratas"
          value={topXp}
          change="siswa terbaik"
          trend="up"
          icon={Crown}
        />
      </div>

      <StreakDisplay
        current={streak.currentStreak}
        longest={streak.longestStreak}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Lencana Terbuka
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {unlocked.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              unlocked
              xp={achievement.xp}
            />
          ))}
          {unlocked.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Belum ada lencana yang terbuka. Terus aktif di sekolahmu!
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="size-4 text-muted-foreground" />
            Terkunci
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {locked.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              xp={achievement.xp}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
