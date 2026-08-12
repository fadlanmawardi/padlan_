import type { Metadata } from "next";
import { BankSoal } from "@/components/teaching/bank-soal";

export const metadata: Metadata = { title: "Bank Soal" };

export default function BankSoalPage() {
  return <BankSoal />;
}
