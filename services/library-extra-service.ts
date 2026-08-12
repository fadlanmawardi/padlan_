import type {
  BookRecordExtra,
  BookRecommendation,
  BookWishlistItem,
} from "@/types";
import {
  dbBookRatings,
  dbBooks,
  dbLoans,
  dbWishlist,
  delay,
  findByCategory,
  nextId,
} from "./store";
import { getBooks } from "./book-service";

function computeRating(bookId: string): { rating: number; ratingCount: number } {
  const ratings = dbBookRatings.filter((r) => r.bookId === bookId);
  if (ratings.length === 0) return { rating: 0, ratingCount: 0 };
  const sum = ratings.reduce((total, r) => total + r.rating, 0);
  return {
    rating: Math.round((sum / ratings.length) * 10) / 10,
    ratingCount: ratings.length,
  };
}

function loanCount(bookId: string): number {
  return dbLoans.filter((l) => l.bookId === bookId).length;
}

export async function getBookRecordsExtra(
  userId?: string
): Promise<BookRecordExtra[]> {
  await delay();
  const books = await getBooks();
  return books.map((book) => {
    const { rating, ratingCount } = computeRating(book.id);
    const wishlisted = userId
      ? dbWishlist.some((w) => w.bookId === book.id && w.userId === userId)
      : false;
    return {
      ...book,
      rating,
      ratingCount,
      favorite: rating >= 4 && ratingCount > 0,
      wishlisted,
      loanCount: loanCount(book.id),
    };
  });
}

export async function getPopularBooks(limit = 6): Promise<BookRecordExtra[]> {
  await delay(200);
  const books = await getBookRecordsExtra();
  return books
    .sort(
      (a, b) =>
        b.loanCount - a.loanCount || b.rating - a.rating
    )
    .slice(0, limit);
}

export async function getFavoriteBooks(
  limit = 6
): Promise<BookRecordExtra[]> {
  await delay(200);
  const books = await getBookRecordsExtra();
  return books
    .filter((b) => b.favorite)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}

export async function getWishlistBooks(
  userId: string
): Promise<BookRecordExtra[]> {
  await delay();
  const books = await getBookRecordsExtra(userId);
  return books.filter((b) => b.wishlisted);
}

export async function toggleWishlist(
  userId: string,
  bookId: string
): Promise<boolean> {
  await delay();
  const existing = dbWishlist.find(
    (w) => w.bookId === bookId && w.userId === userId
  );
  if (existing) {
    const index = dbWishlist.indexOf(existing);
    dbWishlist.splice(index, 1);
    return false;
  }
  dbWishlist.push({
    id: nextId("wl-", dbWishlist.map((w) => w.id)),
    bookId,
    userId,
    createdAt: new Date().toISOString(),
  } satisfies BookWishlistItem);
  return true;
}

export async function rateBook(
  userId: string,
  bookId: string,
  rating: number
): Promise<void> {
  await delay();
  const existing = dbBookRatings.find(
    (r) => r.bookId === bookId && r.userId === userId
  );
  if (existing) {
    existing.rating = rating;
    return;
  }
  dbBookRatings.push({
    id: nextId("rt-", dbBookRatings.map((r) => r.id)),
    bookId,
    userId,
    rating,
    createdAt: new Date().toISOString(),
  });
}

export async function getBookRecommendations(
  userId: string,
  limit = 6
): Promise<BookRecommendation[]> {
  await delay(250);
  const borrowed = dbLoans.filter((l) => l.studentId === userId);
  const borrowedCategoryIds = new Set(
    borrowed
      .map((l) => dbBooks.find((b) => b.id === l.bookId)?.categoryId)
      .filter(Boolean) as string[]
  );
  const borrowedBookIds = new Set(borrowed.map((l) => l.bookId));
  const all = await getBookRecordsExtra(userId);
  const candidates = all
    .filter((b) => !borrowedBookIds.has(b.id))
    .filter((b) =>
      borrowedCategoryIds.size === 0 || borrowedCategoryIds.has(b.categoryId)
    );

  const categoryName = (categoryId: string) =>
    findByCategory(categoryId)?.name ?? "kategori yang sama";

  return candidates
    .sort(
      (a, b) =>
        Number(borrowedCategoryIds.has(b.categoryId)) -
          Number(borrowedCategoryIds.has(a.categoryId)) ||
        b.rating - a.rating ||
        b.loanCount - a.loanCount
    )
    .slice(0, limit)
    .map((book) => ({
      ...book,
      reason:
        borrowedCategoryIds.has(book.categoryId)
          ? `Karena kamu meminjam buku di kategori ${categoryName(book.categoryId)}`
          : "Rekomendasi berdasarkan koleksi populer",
    }));
}

export async function getBookQrUrl(bookId: string): Promise<string> {
  await delay(120);
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=schoolhub://book/${bookId}`;
}

export async function getBookRecordExtraById(
  id: string,
  userId?: string
): Promise<BookRecordExtra | null> {
  await delay(150);
  const books = await getBookRecordsExtra(userId);
  return books.find((b) => b.id === id) ?? null;
}

export function getCategoryColor(categoryId: string): string {
  return findByCategory(categoryId)?.color ?? "chart-1";
}
