import type { Metadata } from "next";
import { StudyTargetsView } from "@/components/student-hub/study-targets-view";

export const metadata: Metadata = { title: "Target Belajar" };

export default function StudyTargetsPage() {
  return <StudyTargetsView />;
}
