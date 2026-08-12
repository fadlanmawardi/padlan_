import type { Metadata } from "next";
import { SubjectsManagement } from "@/components/academic/subjects-management";

export const metadata: Metadata = { title: "Mata Pelajaran" };

export default function SubjectsPage() {
  return <SubjectsManagement />;
}
