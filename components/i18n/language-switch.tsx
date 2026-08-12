"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGUAGES } from "@/lib/i18n";
import { useLang } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";

export function LanguageSwitch() {
  const { lang, setLang } = useLang();
  const current = LANGUAGES.find((option) => option.value === lang);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Ganti bahasa"
        >
          <Languages className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="font-normal">
          <span className="text-sm font-medium">Bahasa</span>
          <span className="text-muted-foreground block text-xs">Language</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LANGUAGES.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setLang(option.value)}
            className={cn(
              option.value === lang &&
                "bg-accent text-accent-foreground"
            )}
          >
            <span>{option.flag}</span>
            {option.label}
            {option.value === lang && (
              <span className="bg-primary ml-auto size-1.5 rounded-full" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <p className="text-muted-foreground px-2 py-1.5 text-xs">
          {current ? `${current.flag} ${current.label}` : "Indonesia"}
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
