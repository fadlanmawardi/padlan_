"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { NAV_ITEMS } from "@/lib/navigation";
import { ROLE_HOME, ROLE_PREFIX, ROLE_LABELS } from "@/lib/permissions";
import type { Role } from "@/types";

interface BreadcrumbProps {
  role: Role;
  pathname: string;
}

export function Breadcrumb({ role, pathname }: BreadcrumbProps) {
  const normalized = pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;

  let matched: { title: string; href: string } | null = null;
  for (const section of NAV_ITEMS[role]) {
    for (const item of section.items) {
      if (item.exact) {
        if (normalized === item.href) matched = { title: item.title, href: item.href };
        continue;
      }
      if (normalized === item.href || normalized.startsWith(item.href + "/")) {
        matched = { title: item.title, href: item.href };
      }
    }
  }

  const isHome = normalized === ROLE_HOME[role];
  const prefix = ROLE_PREFIX[role];

  return (
    <nav
      aria-label="Breadcrumb"
      className="text-muted-foreground mb-4 flex flex-wrap items-center gap-1 text-xs"
    >
      <Link
        href={ROLE_HOME[role]}
        className="hover:text-foreground inline-flex items-center gap-1 font-medium transition-colors"
      >
        <Home className="size-3.5" />
        {ROLE_LABELS[role]}
      </Link>
      {!isHome && (
        <>
          <ChevronRight className="size-3.5 shrink-0" />
          <Link
            href={matched?.href ?? prefix}
            className="hover:text-foreground transition-colors"
          >
            {matched?.title ?? "Halaman"}
          </Link>
        </>
      )}
    </nav>
  );
}
