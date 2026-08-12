import type { Metadata } from "next";
import { RubricManager } from "@/components/teaching/rubric-manager";

export const metadata: Metadata = { title: "Rubrik Penilaian" };

export default function RubricsPage() {
  return <RubricManager />;
}
