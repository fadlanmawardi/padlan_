import type { Metadata } from "next";
import { ExamSchedules } from "@/components/academic/exam-schedules";

export const metadata: Metadata = { title: "Jadwal Ujian" };

export default function ExamsPage() {
  return <ExamSchedules />;
}
