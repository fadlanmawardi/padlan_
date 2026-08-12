import type { Metadata } from "next";
import { TaskBookmarksView } from "@/components/student-hub/task-bookmarks-view";

export const metadata: Metadata = { title: "Bookmark Tugas" };

export default function BookmarksPage() {
  return <TaskBookmarksView />;
}
