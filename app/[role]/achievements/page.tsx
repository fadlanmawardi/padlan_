import type { Metadata } from "next";
import { AchievementsView } from "@/components/community/achievements-view";

export const metadata: Metadata = { title: "Prestasi" };

export default function AchievementsPage() {
  return <AchievementsView />;
}
