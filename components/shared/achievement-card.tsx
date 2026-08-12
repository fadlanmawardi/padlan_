import type { AchievementDef } from "@/types";
import { AchievementIcon } from "@/components/shared/achievement-icon";
import { cn } from "@/lib/utils";

interface AchievementCardProps {
  achievement: AchievementDef;
  unlocked?: boolean;
  xp?: number;
}

export function AchievementCard({
  achievement,
  unlocked = false,
  xp,
}: AchievementCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-4 transition-all hover:shadow-sm",
        unlocked
          ? "border-primary/30 bg-primary/5"
          : "bg-muted/30 opacity-70"
      )}
    >
      <div
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full",
          unlocked
            ? "bg-primary/15 text-primary"
            : "bg-muted text-muted-foreground"
        )}
      >
        <AchievementIcon name={achievement.icon} className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{achievement.title}</p>
        <p className="text-muted-foreground text-xs">{achievement.description}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-full px-2 py-0.5 text-xs font-semibold">
          {unlocked ? `+${achievement.xp} XP` : `${achievement.xp} XP`}
        </p>
        {xp !== undefined && (
          <p className="text-muted-foreground mt-1 text-[10px]">
            {unlocked ? "Terbuka" : "Terkunci"}
          </p>
        )}
      </div>
    </div>
  );
}
