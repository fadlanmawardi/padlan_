import type { Metadata } from "next";
import { StudentManagement } from "@/components/students/student-management";

export const metadata: Metadata = { title: "Siswa" };

export default function StudentsPage() {
  return <StudentManagement />;
}
