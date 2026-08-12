import type { Metadata } from "next";
import { HistoryPage } from "@/components/student/history-page";

export const metadata: Metadata = { title: "Riwayat Peminjaman" };

export default function HistoryRoute() {
  return <HistoryPage />;
}
