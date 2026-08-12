import type { Metadata } from "next";
import { StudyNotesView } from "@/components/student-hub/study-notes-view";

export const metadata: Metadata = { title: "Catatan Belajar" };

export default function StudyNotesPage() {
  return <StudyNotesView />;
}
