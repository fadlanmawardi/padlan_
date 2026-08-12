import type { Metadata } from "next";
import { AcademicCalendar } from "@/components/academic/academic-calendar";

export const metadata: Metadata = { title: "Kalender Akademik" };

export default function AcademicCalendarPage() {
  return <AcademicCalendar />;
}
