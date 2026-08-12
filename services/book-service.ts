import type { Book, BookRecord } from "@/types";
import { delay, dbBooks, findByCategory, nextId } from "./store";

export interface CreateBookInput {
  title: string;
  author: string;
  isbn: string;
  categoryId: string;
  publisher: string;
  year: number;
  totalCopies: number;
}

export type UpdateBookInput = Partial<Book>;

export function toBookRecord(book: Book): BookRecord {
  const category = findByCategory(book.categoryId);
  return {
    ...book,
    categoryName: category?.name ?? "Tanpa Kategori",
    categoryColor: category?.color ?? "chart-1",
  };
}

export async function getBooks(): Promise<BookRecord[]> {
  await delay();
  return dbBooks.map(toBookRecord);
}

export async function getBookById(id: string): Promise<BookRecord | null> {
  await delay(200);
  const book = dbBooks.find((b) => b.id === id);
  return book ? toBookRecord(book) : null;
}

export async function searchBooks(query: string): Promise<BookRecord[]> {
  await delay(300);
  const q = query.trim().toLowerCase();
  if (!q) return dbBooks.map(toBookRecord);
  return dbBooks
    .filter((b) => {
      const category = findByCategory(b.categoryId);
      return (
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        (category?.name.toLowerCase().includes(q) ?? false)
      );
    })
    .map(toBookRecord);
}

export async function createBook(input: CreateBookInput): Promise<Book> {
  await delay();
  const book: Book = {
    id: nextId("b-", dbBooks.map((b) => b.id)),
    title: input.title,
    author: input.author,
    isbn: input.isbn,
    categoryId: input.categoryId,
    publisher: input.publisher,
    year: input.year,
    totalCopies: input.totalCopies,
    availableCopies: input.totalCopies,
    status: input.totalCopies > 0 ? "available" : "unavailable",
  };
  dbBooks.push(book);
  return { ...book };
}

export async function updateBook(
  id: string,
  patch: UpdateBookInput
): Promise<Book> {
  await delay();
  const index = dbBooks.findIndex((b) => b.id === id);
  if (index === -1) throw new Error("Buku tidak ditemukan");
  const current = dbBooks[index];
  const borrowed = current.totalCopies - current.availableCopies;
  const totalCopies = patch.totalCopies ?? current.totalCopies;
  const availableCopies = Math.max(0, totalCopies - borrowed);
  dbBooks[index] = {
    ...current,
    ...patch,
    id,
    totalCopies,
    availableCopies,
    status: availableCopies > 0 ? "available" : "borrowed",
  };
  return { ...dbBooks[index] };
}

export async function deleteBook(id: string): Promise<void> {
  await delay();
  const index = dbBooks.findIndex((b) => b.id === id);
  if (index !== -1) dbBooks.splice(index, 1);
}
