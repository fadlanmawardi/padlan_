import type { Metadata } from "next";
import { MyBooksPage } from "@/components/student/my-books-page";

export const metadata: Metadata = { title: "Buku Saya" };

export default function MyBooksRoute() {
  return <MyBooksPage />;
}
