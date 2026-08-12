import type { Metadata } from "next";
import { AdminManagement } from "@/components/admin/admin-management";

export const metadata: Metadata = { title: "Manajemen Admin" };

export default function AdminPage() {
  return <AdminManagement />;
}
