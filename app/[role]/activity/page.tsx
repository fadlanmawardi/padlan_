import type { Metadata } from "next";
import { ActivityTimeline } from "@/components/community/activity-timeline";

export const metadata: Metadata = { title: "Aktivitas" };

export default function ActivityPage() {
  return <ActivityTimeline />;
}
