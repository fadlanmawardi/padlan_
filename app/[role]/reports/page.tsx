import type { Metadata } from "next";
import { ReportContent } from "@/components/reports/report-content";

export const metadata: Metadata = { title: "Laporan" };

export default function ReportsPage() {
  return <ReportContent />;
}
