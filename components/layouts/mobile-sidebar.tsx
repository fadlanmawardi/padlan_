"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SidebarContent } from "@/components/layouts/sidebar";
import type { Role } from "@/types";

interface MobileSidebarProps {
  role: Role;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ role, open, onOpenChange }: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="bg-sidebar w-72 border-sidebar-border p-0 text-sidebar-foreground"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Navigasi SchoolHub</SheetTitle>
          <SheetDescription>
            Menu navigasi aplikasi sistem informasi sekolah
          </SheetDescription>
        </SheetHeader>
        <SidebarContent role={role} />
      </SheetContent>
    </Sheet>
  );
}
