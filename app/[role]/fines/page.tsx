import type { Metadata } from "next";
import { FineManagement } from "@/components/fines/fine-management";

export const metadata: Metadata = { title: "Denda" };

export default function FinesPage() {
  return <FineManagement />;
}
