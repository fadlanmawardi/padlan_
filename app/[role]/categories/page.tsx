import type { Metadata } from "next";
import { CategoryManagement } from "@/components/categories/category-management";

export const metadata: Metadata = { title: "Kategori" };

export default function CategoriesPage() {
  return <CategoryManagement />;
}
