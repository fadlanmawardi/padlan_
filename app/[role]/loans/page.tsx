import type { Metadata } from "next";
import { LoanManagement } from "@/components/loans/loan-management";

export const metadata: Metadata = { title: "Peminjaman" };

export default function LoansPage() {
  return <LoanManagement />;
}
