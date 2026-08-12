import {
  ArrowLeftRight,
  CalendarCheck,
  ClipboardList,
  HandCoins,
  LibraryBig,
  Settings,
  Undo2,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { Activity, ActivityType } from "@/types";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<ActivityType, LucideIcon> = {
  loan: ArrowLeftRight,
  return: Undo2,
  fine: HandCoins,
  user: UserRound,
  book: LibraryBig,
  assignment: ClipboardList,
  attendance: CalendarCheck,
  system: Settings,
};

export function ActivityFeed({
  activities,
  className,
}: {
  activities: Activity[];
  className?: string;
}) {
  return (
    <ul className={cn("space-y-1", className)}>
      {activities.map((activity) => {
        const Icon = TYPE_ICON[activity.type] ?? Settings;
        return (
          <li key={activity.id} className="flex gap-3 rounded-lg px-2 py-2.5">
            <div className="bg-primary/10 text-primary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full">
              <Icon className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug">
                <span className="font-medium">{activity.user}</span>{" "}
                <span className="text-muted-foreground">
                  {activity.message}
                </span>
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {relativeTime(activity.timestamp)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
