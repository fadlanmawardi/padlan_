import type { Metadata } from "next";
import { ScheduleManagement } from "@/components/academic/schedule-management";

export const metadata: Metadata = { title: "Jadwal Pelajaran" };

export default function SchedulePage() {
  return <ScheduleManagement />;
}
