import type { Metadata } from "next";
import { ReportCardView } from "@/components/academic/report-card-view";

export const metadata: Metadata = { title: "Rapor" };

export default function ReportCardsPage() {
  return <ReportCardView />;
}
