"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function Breadcrumb({ children, className }: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center text-sm", className)}
    >
      <ol className="flex flex-wrap items-center gap-1.5">{children}</ol>
    </nav>
  );
}

function BreadcrumbItem({
  children,
  className,
  href,
  isCurrent = false,
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
  isCurrent?: boolean;
}) {
  const base = cn(
    "truncate text-muted-foreground transition-colors",
    href && "hover:text-foreground",
    isCurrent && "text-foreground font-medium",
    className
  );

  if (href && !isCurrent) {
    return (
      <li className="flex items-center gap-1.5">
        <a href={href} className={base}>
          {children}
        </a>
        <ChevronRight className="text-muted-foreground/50 size-3.5" />
      </li>
    );
  }

  return (
    <li className="flex items-center gap-1.5">
      <span className={base}>{children}</span>
    </li>
  );
}

export { Breadcrumb, BreadcrumbItem };
