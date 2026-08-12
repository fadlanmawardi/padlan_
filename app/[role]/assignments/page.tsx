import type { Metadata } from "next";
import { AssignmentManagement } from "@/components/assignments/assignment-management";
import { StudentAssignments } from "@/components/assignments/student-assignments";
import { slugToRole } from "@/lib/permissions";

export const metadata: Metadata = { title: "Tugas" };

interface AssignmentsPageProps {
  params: Promise<{ role: string }>;
}

export default async function AssignmentsPage({ params }: AssignmentsPageProps) {
  const { role } = await params;
  if (slugToRole(role) === "student") return <StudentAssignments />;
  return <AssignmentManagement />;
}
