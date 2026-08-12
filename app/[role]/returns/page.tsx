import type { Metadata } from "next";
import { ReturnManagement } from "@/components/returns/return-management";

export const metadata: Metadata = { title: "Pengembalian" };

export default function ReturnsPage() {
  return <ReturnManagement />;
}
