import type { Metadata } from "next";
import { BookManagement } from "@/components/books/book-management";
import { BookCatalog } from "@/components/student/book-catalog";
import { slugToRole } from "@/lib/permissions";

export const metadata: Metadata = { title: "Buku" };

interface BooksPageProps {
  params: Promise<{ role: string }>;
}

export default async function BooksPage({ params }: BooksPageProps) {
  const { role } = await params;
  if (slugToRole(role) === "student") return <BookCatalog />;
  return <BookManagement />;
}
