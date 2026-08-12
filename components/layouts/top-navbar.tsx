"use client";

import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { getPageTitle } from "@/lib/navigation";
import { ROLE_LABELS } from "@/lib/permissions";
import type { Role } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";
import { UserMenu } from "@/components/layouts/user-menu";
import { NotificationMenu } from "@/components/layouts/notification-menu";
import { ThemeSwitch } from "@/components/theme/theme-switch";

interface TopNavbarProps {
  role: Role;
  onOpenMobile: () => void;
}

export function TopNavbar({ role, onOpenMobile }: TopNavbarProps) {
  const pathname = usePathname();
  const title = getPageTitle(role, pathname);

  return (
    <header className="bg-card/80 border-border sticky top-0 z-30 flex h-16 items-center gap-2 border-b px-4 backdrop-blur-md sm:gap-3 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenMobile}
        aria-label="Buka menu navigasi"
      >
        <Menu className="size-5" />
      </Button>

      <div className="min-w-0 flex-1">
        <Breadcrumb>
          <BreadcrumbItem>{ROLE_LABELS[role]}</BreadcrumbItem>
          <BreadcrumbItem isCurrent>{title}</BreadcrumbItem>
        </Breadcrumb>
        <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">
          {title}
        </h1>
      </div>

      <div className="relative hidden md:block">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="Cari di SchoolHub…"
          className="bg-muted/50 w-48 pl-9 transition-all focus:w-64 lg:w-64 lg:focus:w-72"
        />
      </div>

      <NotificationMenu />

      <ThemeSwitch />

      <div className="mx-1 hidden h-6 w-px bg-border sm:block" />

      <UserMenu />
    </header>
  );
}
