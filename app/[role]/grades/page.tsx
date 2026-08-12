import type { Metadata } from "next";
import { GradesView } from "@/components/academic/grades-view";

export const metadata: Metadata = { title: "Nilai" };

export default function GradesPage() {
  return <GradesView />;
}
