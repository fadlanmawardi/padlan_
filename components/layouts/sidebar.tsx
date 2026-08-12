"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronsLeft,
  ChevronsRight,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { NAV_ITEMS, type NavItem } from "@/lib/navigation";
import type { Role } from "@/types";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { useAuth } from "@/components/auth/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getInitials } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/permissions";

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

interface SidebarContentProps {
  role: Role;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const link = (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors",
        collapsed ? "justify-center px-0" : "px-3",
        active
          ? "bg-sidebar-accent text-sidebar-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
      )}
      aria-label={collapsed ? item.title : undefined}
    >
      <span
        className={cn(
          "absolute top-1/2 left-0 h-5 -translate-y-1/2 rounded-r-full transition-all",
          active ? "bg-primary w-1" : "w-0"
        )}
      />
      <item.icon
        className={cn(
          "size-4.5 shrink-0",
          active ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
        )}
      />
      {!collapsed && <span className="truncate">{item.title}</span>}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" className="bg-foreground text-background">
        {item.title}
      </TooltipContent>
    </Tooltip>
  );
}

export function SidebarContent({
  role,
  collapsed = false,
  onToggleCollapse,
}: SidebarContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const sections = NAV_ITEMS[role];

  async function handleLogout() {
    await signOut();
    toast.success("Berhasil keluar");
    router.push("/login");
  }

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-sidebar-border",
          collapsed ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        <Logo compact={collapsed} subtitle="Perpustakaan Digital" />
        {onToggleCollapse && !collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={onToggleCollapse}
            aria-label="Ciutkan sidebar"
          >
            <ChevronsLeft className="size-4.5" />
          </Button>
        )}
        {onToggleCollapse && collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 -right-3.5 z-10 hidden size-7 rounded-full border bg-card text-foreground shadow-sm lg:flex"
            onClick={onToggleCollapse}
            aria-label="Bentangkan sidebar"
          >
            <ChevronsRight className="size-3.5" />
          </Button>
        )}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {sections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                {section.title}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = isNavItemActive(pathname, item);
                return (
                  <li key={item.href} className={cn(!collapsed && "px-0.5")}>
                    <NavLink item={item} active={active} collapsed={collapsed} />
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        <div className={cn("flex items-center", collapsed ? "flex-col gap-2" : "justify-between gap-2")}>
          <div
            className={cn(
              "flex min-w-0 items-center gap-2.5 rounded-lg",
              collapsed ? "flex-col" : "flex-1"
            )}
          >
            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {getInitials(user?.name ?? "Pengguna")}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-medium">{user?.name}</p>
                <p className="text-sidebar-foreground/50 truncate text-xs">
                  {user ? ROLE_LABELS[user.role] : "-"}
                </p>
              </div>
            )}
          </div>

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-sidebar-foreground/60 hover:bg-destructive/10 hover:text-destructive"
                onClick={handleLogout}
                aria-label="Keluar"
              >
                <LogOut className="size-4.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side={collapsed ? "right" : "top"} className="bg-foreground text-background">
              Keluar
            </TooltipContent>
          </Tooltip>
        </div>
        {!collapsed && (
          <p className="text-sidebar-foreground/40 mt-3 text-center text-[11px]">
            SchoolHub · v0.1.0
          </p>
        )}
      </div>
    </div>
  );
}

interface SidebarProps {
  role: Role;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ role, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground fixed inset-y-0 left-0 z-40 hidden border-r border-sidebar-border transition-[width] duration-200 lg:block",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <TooltipProvider delayDuration={0}>
        <SidebarContent
          role={role}
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
        />
      </TooltipProvider>
    </aside>
  );
}
