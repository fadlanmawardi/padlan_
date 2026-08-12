import type { Metadata } from "next";
import { LeaderboardView } from "@/components/community/leaderboard-view";

export const metadata: Metadata = { title: "Papan Peringkat" };

export default function LeaderboardPage() {
  return <LeaderboardView />;
}
