import type { Category } from "@/types";
import { dbCategories, dbBooks, delay, nextId } from "./store";

export interface CreateCategoryInput {
  name: string;
  description: string;
  color: string;
}

export async function getCategories(): Promise<Category[]> {
  await delay();
  return dbCategories
    .map((c) => {
      const count = dbBooks.filter((b) => b.categoryId === c.id).length;
      return { ...c, bookCount: count };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function createCategory(
  input: CreateCategoryInput
): Promise<Category> {
  await delay();
  const category: Category = {
    id: nextId("c-", dbCategories.map((c) => c.id)),
    name: input.name,
    description: input.description,
    color: input.color,
    bookCount: 0,
  };
  dbCategories.push(category);
  return { ...category };
}

export async function updateCategory(
  id: string,
  patch: Partial<Omit<Category, "id" | "bookCount">>
): Promise<Category> {
  await delay();
  const index = dbCategories.findIndex((c) => c.id === id);
  if (index === -1) throw new Error("Kategori tidak ditemukan");
  dbCategories[index] = { ...dbCategories[index], ...patch, id };
  return { ...dbCategories[index] };
}

export async function deleteCategory(id: string): Promise<void> {
  await delay();
  const used = dbBooks.filter((b) => b.categoryId === id).length;
  if (used > 0) {
    throw new Error(
      `Kategori masih digunakan oleh ${used} buku. Pindahkan atau hapus buku tersebut terlebih dahulu.`
    );
  }
  const index = dbCategories.findIndex((c) => c.id === id);
  if (index !== -1) dbCategories.splice(index, 1);
}
