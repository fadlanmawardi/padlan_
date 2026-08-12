import type { Loan, LoanRecord } from "@/types";
import {
  delay,
  dbFines,
  dbLoans,
  findByBook,
  findByUser,
  nextId,
} from "./store";
import { getSettings } from "./settings-service";
import { pushNotification } from "./community-service";

const notifiedOverdue = new Set<string>();

export interface CreateLoanInput {
  bookId: string;
  studentId: string;
  durationDays?: number;
}

function toLoanRecord(loan: Loan): LoanRecord {
  const book = findByBook(loan.bookId);
  const student = findByUser(loan.studentId);
  return {
    ...loan,
    bookTitle: book?.title ?? "Buku telah dihapus",
    bookAuthor: book?.author,
    studentName: student?.name ?? "Siswa telah dihapus",
    className: student?.className,
  };
}

export async function getLoans(): Promise<LoanRecord[]> {
  await delay();
  return dbLoans
    .map(toLoanRecord)
    .sort((a, b) => b.borrowedAt.localeCompare(a.borrowedAt));
}

export async function getActiveLoans(): Promise<LoanRecord[]> {
  await delay(300);
  return dbLoans
    .filter((l) => l.status === "borrowed" || l.status === "overdue")
    .map(toLoanRecord)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}

export async function getStudentLoans(
  studentId: string
): Promise<LoanRecord[]> {
  await delay(300);
  return dbLoans
    .filter((l) => l.studentId === studentId)
    .map(toLoanRecord)
    .sort((a, b) => b.borrowedAt.localeCompare(a.borrowedAt));
}

export async function createLoan(
  input: CreateLoanInput
): Promise<LoanRecord> {
  await delay();
  const settings = await getSettings();
  const book = findByBook(input.bookId);
  if (!book) throw new Error("Buku tidak ditemukan");
  if (book.availableCopies <= 0) {
    throw new Error("Stok buku sedang habis dipinjam");
  }
  const active = dbLoans.filter(
    (l) =>
      l.studentId === input.studentId &&
      (l.status === "borrowed" || l.status === "overdue")
  ).length;
  if (active >= settings.maxLoansPerStudent) {
    throw new Error(
      `Siswa telah mencapai batas peminjaman (${settings.maxLoansPerStudent} buku)`
    );
  }
  const durationDays = input.durationDays ?? settings.loanDurationDays;
  const now = new Date();
  const due = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
  book.availableCopies = Math.max(0, book.availableCopies - 1);
  book.status = book.availableCopies > 0 ? "available" : "borrowed";
  const loan: Loan = {
    id: nextId("L-", dbLoans.map((l) => l.id)),
    bookId: input.bookId,
    studentId: input.studentId,
    borrowedAt: now.toISOString(),
    dueAt: due.toISOString(),
    status: "borrowed",
  };
  dbLoans.push(loan);
  const dueLabel = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(due);
  void pushNotification({
    userId: input.studentId,
    type: "book_due",
    title: "Buku berhasil dipinjam",
    message: `📚 ${book.title} kamu jatuh tempo ${dueLabel}. Jangan lupa dikembalikan ya!`,
    link: `/student/my-books`,
  });
  return toLoanRecord(loan);
}

export async function returnLoan(loanId: string): Promise<LoanRecord> {
  await delay();
  const settings = await getSettings();
  const loan = dbLoans.find((l) => l.id === loanId);
  if (!loan) throw new Error("Peminjaman tidak ditemukan");
  if (loan.status === "returned") throw new Error("Buku sudah dikembalikan");
  const book = findByBook(loan.bookId);
  const now = new Date();
  loan.returnedAt = now.toISOString();
  loan.status = "returned";
  if (book) {
    book.availableCopies = Math.min(
      book.totalCopies,
      book.availableCopies + 1
    );
    book.status = "available";
  }
  const lateDays = Math.ceil(
    (now.getTime() - new Date(loan.dueAt).getTime()) / (24 * 60 * 60 * 1000)
  );
  const fine = lateDays > 0 ? lateDays * settings.finePerDay : 0;
  if (fine > 0) {
    loan.fineAmount = fine;
    dbFines.push({
      id: nextId("F-", dbFines.map((f) => f.id)),
      loanId,
      studentId: loan.studentId,
      amount: fine,
      status: "unpaid",
      issuedAt: now.toISOString(),
    });
  }
  void pushNotification({
    userId: loan.studentId,
    type: "book_due",
    title: "Buku dikembalikan",
    message:
      fine > 0
        ? `✅ Buku ${book?.title ?? ""} dikembalikan dengan denda Rp${fine.toLocaleString("id-ID")}.`
        : `✅ Buku ${book?.title ?? ""} berhasil dikembalikan. Terima kasih!`,
    link: `/student/my-books`,
  });
  return toLoanRecord(loan);
}

/** Tandai peminjaman yang terlambat dan beri notifikasi (hanya sekali per buku). */
export async function refreshOverdueLoans(): Promise<number> {
  await delay(100);
  const now = Date.now();
  let notified = 0;
  for (const loan of dbLoans) {
    if (loan.status !== "borrowed") continue;
    if (now < new Date(loan.dueAt).getTime()) continue;
    loan.status = "overdue";
    if (notifiedOverdue.has(loan.id)) continue;
    notifiedOverdue.add(loan.id);
    const book = findByBook(loan.bookId);
    void pushNotification({
      userId: loan.studentId,
      type: "book_due",
      title: "Buku melewati jatuh tempo",
      message: `⏰ "${book?.title ?? "Buku"}" sudah melewati jatuh tempo. Segera kembalikan untuk menghindari denda.`,
      link: `/student/my-books`,
    });
    notified += 1;
  }
  return notified;
}
