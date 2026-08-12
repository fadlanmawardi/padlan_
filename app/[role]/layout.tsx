"use client";

import { useParams, usePathname, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layouts/app-shell";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { useAuth } from "@/components/auth/auth-provider";
import { getRedirectPath, slugToRole } from "@/lib/permissions";
import { NAV_ITEMS } from "@/lib/navigation";
import type { Role } from "@/types";

function isAllowedPath(role: Role, pathname: string): boolean {
  return NAV_ITEMS[role].some((section) =>
    section.items.some(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    )
  );
}

export default function RoleLayout({ children }: { children: ReactNode }) {
  const params = useParams<{ role: string }>();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const role = slugToRole(params.role);

  if (loading) return <LoadingScreen />;
  if (!user) redirect("/login");
  if (!role || user.role !== role) redirect(getRedirectPath(user.role));
  if (!isAllowedPath(role, pathname)) redirect(getRedirectPath(role));

  return <AppShell role={role}>{children}</AppShell>;
}
