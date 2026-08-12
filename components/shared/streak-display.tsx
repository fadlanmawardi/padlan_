import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakDisplayProps {
  current: number;
  longest: number;
  className?: string;
}

export function StreakDisplay({ current, longest, className }: StreakDisplayProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 px-4 py-3",
        className
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-orange-500/15">
        <Flame className={cn("size-6", current > 0 ? "text-orange-500" : "text-muted-foreground")} />
      </div>
      <div>
        <p className="text-sm font-semibold">
          {current > 0 ? (
            <>
              <span className="text-lg font-bold">{current}</span> hari berturut-turut
            </>
          ) : (
            "Mulai streak-mu hari ini!"
          )}
        </p>
        <p className="text-muted-foreground text-xs">
          Rekor terpanjang: {longest} hari 🔥
        </p>
      </div>
    </div>
  );
}
