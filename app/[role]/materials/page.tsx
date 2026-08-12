import type { Metadata } from "next";
import { MaterialManager } from "@/components/teaching/material-manager";

export const metadata: Metadata = { title: "Materi Pembelajaran" };

export default function MaterialsPage() {
  return <MaterialManager />;
}
