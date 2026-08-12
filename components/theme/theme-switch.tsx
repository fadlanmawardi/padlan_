"use client";

import * as React from "react";
import { Laptop, Moon, Palette, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  ACCENT_OPTIONS,
  useAccent,
} from "@/components/theme/theme-provider";

export function ThemeSwitch() {
  const { resolvedTheme, theme, setTheme } = useTheme();
  const { accent, setAccent } = useAccent();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const current = theme === "system" ? resolvedTheme : theme;

  const options = [
    { value: "light", label: "Terang", icon: Sun },
    { value: "dark", label: "Gelap", icon: Moon },
    { value: "system", label: "Sistem", icon: Laptop },
  ] as const;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Ganti tema"
        >
          {!mounted ? (
            <Sun className="size-5" />
          ) : (
            <>
              {current === "dark" ? (
                <Moon className="size-5" />
              ) : current === "light" ? (
                <Sun className="size-5" />
              ) : (
                <Laptop className="size-5" />
              )}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="font-normal">
          <span className="text-sm font-medium">Tema</span>
          <span className="text-muted-foreground block text-xs">
            Pilih tampilan aplikasi
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => {
          const Icon = option.icon;
          const active = current === option.value;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={cn(
                active &&
                  "bg-accent text-accent-foreground data-[variant=destructive]:bg-accent"
              )}
            >
              <Icon className="size-4" />
              {option.label}
              {active && (
                <span className="bg-primary ml-auto size-1.5 rounded-full" />
              )}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2 font-normal">
          <Palette className="size-4" />
          <span className="text-sm font-medium">Warna Aksen</span>
        </DropdownMenuLabel>
        <div className="flex items-center justify-between px-2 py-1.5">
          {ACCENT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setAccent(option.value)}
              className={cn(
                "flex size-7 items-center justify-center rounded-full ring-2 ring-transparent transition-all hover:scale-110",
                accent === option.value && "ring-primary"
              )}
              style={{ backgroundColor: option.swatch }}
              aria-label={option.label}
              title={option.label}
            />
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
