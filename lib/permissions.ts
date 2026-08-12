import type { Role } from "@/types";

const ROLE_FROM_SLUG: Record<string, Role> = {
  "super-admin": "superadmin",
  admin: "admin",
  student: "student",
};

export function slugToRole(slug: string | string[] | undefined): Role | null {
  if (!slug || Array.isArray(slug)) return null;
  return ROLE_FROM_SLUG[slug] ?? null;
}

export const ROLE_LABELS: Record<Role, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  student: "Siswa",
};

export const ROLE_HOME: Record<Role, string> = {
  superadmin: "/super-admin/dashboard",
  admin: "/admin/dashboard",
  student: "/student/dashboard",
};

export const ROLE_PREFIX: Record<Role, string> = {
  superadmin: "/super-admin",
  admin: "/admin",
  student: "/student",
};

export function isRole(value: unknown): value is Role {
  return value === "superadmin" || value === "admin" || value === "student";
}

export function getRedirectPath(role: Role | null | undefined): string {
  if (!role) return "/login";
  return ROLE_HOME[role];
}

export function getRolePrefix(role: Role): string {
  return ROLE_PREFIX[role];
}
