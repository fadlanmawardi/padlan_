import type { Fine, FineRecord } from "@/types";
import { dbFines, dbLoans, delay, findByBook, findByUser } from "./store";

function toFineRecord(fine: Fine): FineRecord {
  const loan = dbLoans.find((l) => l.id === fine.loanId);
  const book = loan ? findByBook(loan.bookId) : undefined;
  return {
    ...fine,
    studentName: findByUser(fine.studentId)?.name ?? "Siswa dihapus",
    bookTitle: book?.title ?? "Buku",
  };
}

export async function getFines(): Promise<FineRecord[]> {
  await delay();
  return dbFines
    .map(toFineRecord)
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}

export async function getStudentFines(studentId: string): Promise<Fine[]> {
  await delay(300);
  return dbFines
    .filter((f) => f.studentId === studentId)
    .map((f) => ({ ...f }))
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}

export async function payFine(fineId: string): Promise<Fine> {
  await delay();
  const fine = dbFines.find((f) => f.id === fineId);
  if (!fine) throw new Error("Denda tidak ditemukan");
  if (fine.status === "paid") throw new Error("Denda sudah dibayar");
  fine.status = "paid";
  fine.paidAt = new Date().toISOString();
  return { ...fine };
}
