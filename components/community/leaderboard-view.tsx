"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Crown,
  Medal,
  Trophy,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { PageLoader } from "@/components/shared/loading-screen";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/components/auth/auth-provider";
import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getLeaderboard } from "@/services/gamification-service";
import type { LeaderboardRow } from "@/types";

const MEDAL_COLORS = [
  "bg-amber-400/20 text-amber-500",
  "bg-slate-400/20 text-slate-500",
  "bg-orange-400/20 text-orange-500",
];

const AVATAR_COLORS = [
  "bg-primary/15 text-primary",
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  "bg-rose-500/15 text-rose-600 dark:text-rose-400",
];

export function LeaderboardView() {
  const { user } = useAuth();
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);

  const load = useCallback(async () => {
    const list = await getLeaderboard(10);
    setRows(list);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!rows) return <PageLoader />;

  const currentUser = user?.role === "student" ? user : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Papan Peringkat"
        description="Siswa berprestasi dengan poin XP tertinggi."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="gap-0 py-0">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/15 text-amber-500 flex size-10 items-center justify-center rounded-full">
                <Crown className="size-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Juara 1</p>
                <p className="text-lg font-bold">{rows[0]?.name ?? "-"}</p>
                <p className="text-muted-foreground text-xs">
                  {rows[0]?.xp ?? 0} XP · {rows[0]?.className ?? ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="gap-0 py-0">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="bg-slate-400/15 text-slate-500 flex size-10 items-center justify-center rounded-full">
                <Medal className="size-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Juara 2</p>
                <p className="text-lg font-bold">{rows[1]?.name ?? "-"}</p>
                <p className="text-muted-foreground text-xs">
                  {rows[1]?.xp ?? 0} XP · {rows[1]?.className ?? ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="gap-0 py-0">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="bg-orange-400/15 text-orange-500 flex size-10 items-center justify-center rounded-full">
                <Medal className="size-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Juara 3</p>
                <p className="text-lg font-bold">{rows[2]?.name ?? "-"}</p>
                <p className="text-muted-foreground text-xs">
                  {rows[2]?.xp ?? 0} XP · {rows[2]?.className ?? ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-card">
        {rows.map((row, index) => {
          const isCurrentUser = currentUser?.uid === row.userId;
          return (
            <div
              key={row.userId}
              className={cn(
                "flex items-center gap-4 border-b p-4 last:border-b-0",
                index < 3 && "bg-primary/[0.03]",
                isCurrentUser && "bg-primary/10"
              )}
            >
              <div className="flex w-10 justify-center">
                {index < 3 ? (
                  <div
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full",
                      MEDAL_COLORS[index]
                    )}
                  >
                    {index === 0 ? (
                      <Crown className="size-4" />
                    ) : (
                      <Medal className="size-4" />
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground font-semibold">
                    {index + 1}
                  </span>
                )}
              </div>
              <Avatar className="size-10">
                <AvatarFallback
                  className={cn(
                    "text-xs font-semibold",
                    AVATAR_COLORS[index % AVATAR_COLORS.length]
                  )}
                >
                  {getInitials(row.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {row.name}
                  {isCurrentUser && (
                    <span className="bg-primary/15 text-primary ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                      Kamu
                    </span>
                  )}
                </p>
                <p className="text-muted-foreground text-xs">{row.className}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{row.xp}</p>
                <p className="text-muted-foreground text-xs">XP</p>
              </div>
            </div>
          );
        })}
      </div>

      {!currentUser && (
        <div className="bg-muted/40 text-muted-foreground flex items-center gap-2 rounded-xl border px-4 py-3 text-sm">
          <Trophy className="size-4" />
          Siswa login untuk melihat peringkat personalmu.
        </div>
      )}
    </div>
  );
}
