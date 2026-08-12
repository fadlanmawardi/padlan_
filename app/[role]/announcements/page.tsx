import type { Metadata } from "next";
import { AnnouncementsView } from "@/components/community/announcements-view";

export const metadata: Metadata = { title: "Pengumuman" };

export default function AnnouncementsPage() {
  return <AnnouncementsView />;
}
