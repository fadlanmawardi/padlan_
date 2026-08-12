import {
  Award,
  BookMarked,
  CheckCircle2,
  ClipboardCheck,
  Flame,
  Sunrise,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  CheckCircle2,
  BookMarked,
  Zap,
  Trophy,
  Sunrise,
  ClipboardCheck,
  Award,
  Flame,
};

export function AchievementIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICON_MAP[name] ?? Award;
  return <Icon className={className} />;
}
