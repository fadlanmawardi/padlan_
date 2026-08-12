"use client";

import { useParams } from "next/navigation";
import { SuperAdminDashboard } from "@/components/dashboard/super-admin-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { slugToRole } from "@/lib/permissions";

export default function DashboardPage() {
  const params = useParams<{ role: string }>();
  const role = slugToRole(params.role);

  if (role === "student") return <StudentDashboard />;
  if (role === "superadmin") return <SuperAdminDashboard />;
  if (role === "admin") return <AdminDashboard />;
  return null;
}
