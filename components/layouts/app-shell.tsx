"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layouts/sidebar";
import { MobileSidebar } from "@/components/layouts/mobile-sidebar";
import { TopNavbar } from "@/components/layouts/top-navbar";
import { Breadcrumb } from "@/components/layouts/breadcrumb";
import { CommandPalette } from "@/components/shared/command-palette";
import { FloatingActionButton } from "@/components/shared/floating-action-button";
import { AiAssistant } from "@/components/shared/ai-assistant";
import { WelcomeOverlay } from "@/components/welcome/welcome-overlay";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

const COLLAPSE_KEY = "sh-sidebar-collapsed";

interface AppShellProps {
  role: Role;
  children: ReactNode;
}

export function AppShell({ role, children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      // abaikan jika localStorage tidak tersedia
    }
  }, []);

  function toggleCollapse() {
    setCollapsed((value) => {
      const next = !value;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // abaikan
      }
      return next;
    });
  }

  return (
    <div className="bg-background min-h-screen">
      <Sidebar
        role={role}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      />
      <MobileSidebar
        role={role}
        open={mobileOpen}
        onOpenChange={setMobileOpen}
      />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-200",
          collapsed ? "lg:pl-16" : "lg:pl-64"
        )}
      >
        <TopNavbar role={role} onOpenMobile={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          <Breadcrumb role={role} pathname={pathname} />
          {children}
        </main>
      </div>
      <CommandPalette />
      <FloatingActionButton role={role} />
      <AiAssistant />
      <WelcomeOverlay />
    </div>
  );
}
