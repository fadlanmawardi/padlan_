import type { Metadata } from "next";
import { AuditLogView } from "@/components/community/audit-log-view";

export const metadata: Metadata = { title: "Log Audit" };

export default function AuditLogPage() {
  return <AuditLogView />;
}
