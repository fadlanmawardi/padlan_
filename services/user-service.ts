import type { AppUser, Role, UserStatus } from "@/types";
import { delay, dbUsers, nextId } from "./store";

export interface CreateUserInput {
  name: string;
  email: string;
  role: Role;
  nis?: string;
  className?: string;
  phone?: string;
  status?: UserStatus;
}

export type UpdateUserInput = Partial<
  Omit<AppUser, "uid" | "createdAt" | "role">
>;

export function cloneUser(user: AppUser): AppUser {
  return { ...user };
}

export async function getAdmins(): Promise<AppUser[]> {
  await delay();
  return dbUsers.filter((u) => u.role === "admin").map(cloneUser);
}

export async function getStudents(): Promise<AppUser[]> {
  await delay();
  return dbUsers
    .filter((u) => u.role === "student")
    .map(cloneUser)
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
}

export async function getAllUsers(): Promise<AppUser[]> {
  await delay();
  return dbUsers.map(cloneUser);
}

export async function getUserById(uid: string): Promise<AppUser | null> {
  await delay(200);
  const user = dbUsers.find((u) => u.uid === uid);
  return user ? cloneUser(user) : null;
}

export async function createUser(input: CreateUserInput): Promise<AppUser> {
  await delay();
  const user: AppUser = {
    uid: nextId("u-", dbUsers.map((u) => u.uid)),
    name: input.name,
    email: input.email,
    role: input.role,
    nis: input.nis,
    className: input.className,
    phone: input.phone,
    status: input.status ?? "active",
    createdAt: new Date().toISOString(),
  };
  dbUsers.push(user);
  return cloneUser(user);
}

export async function updateUser(
  uid: string,
  patch: UpdateUserInput
): Promise<AppUser> {
  await delay();
  const index = dbUsers.findIndex((u) => u.uid === uid);
  if (index === -1) throw new Error("Pengguna tidak ditemukan");
  dbUsers[index] = { ...dbUsers[index], ...patch, uid };
  return cloneUser(dbUsers[index]);
}

export async function deleteUser(uid: string): Promise<void> {
  await delay();
  const index = dbUsers.findIndex((u) => u.uid === uid);
  if (index !== -1) dbUsers.splice(index, 1);
}

export async function findUserByEmail(
  email: string
): Promise<AppUser | null> {
  const user = dbUsers.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  );
  return user ? cloneUser(user) : null;
}
