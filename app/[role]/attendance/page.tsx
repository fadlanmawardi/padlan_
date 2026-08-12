import type { Metadata } from "next";
import { AttendanceManagement } from "@/components/attendance/attendance-management";
import { StudentAttendance } from "@/components/attendance/student-attendance";
import { slugToRole } from "@/lib/permissions";

export const metadata: Metadata = { title: "Absensi" };

interface AttendancePageProps {
  params: Promise<{ role: string }>;
}

export default async function AttendancePage({ params }: AttendancePageProps) {
  const { role } = await params;
  const normalized = slugToRole(role);
  if (normalized === "student") return <StudentAttendance />;
  return <AttendanceManagement mode={normalized === "superadmin" ? "superadmin" : "admin"} />;
}
