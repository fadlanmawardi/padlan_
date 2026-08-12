"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileSearch, Loader2, Search } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/auth-provider";
import { smartSearch } from "@/services/search-service";
import type { SearchResultGroup } from "@/types";
import { AchievementIcon } from "@/components/shared/achievement-icon";
import { cn } from "@/lib/utils";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SearchResultGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const { user } = useAuth();

  const flatItems = groups.flatMap((group) =>
    group.items.map((item) => ({ group, item }))
  );

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const runSearch = useCallback(
    async (value: string) => {
      if (!user) return;
      if (value.trim().length < 2) {
        setGroups([]);
        return;
      }
      setLoading(true);
      const result = await smartSearch({
        query: value,
        role: user.role,
        userId: user.uid,
      });
      setGroups(result);
      setActiveIndex(0);
      setLoading(false);
    },
    [user]
  );

  useEffect(() => {
    const id = setTimeout(() => void runSearch(query), 300);
    return () => clearTimeout(id);
  }, [query, runSearch]);

  function navigate(item: { href: string }) {
    setOpen(false);
    setQuery("");
    setGroups([]);
    router.push(item.href);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(flatItems.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(0, index - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = flatItems[activeIndex];
      if (target) navigate(target.item);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="top-[30%] gap-0 overflow-hidden p-0 sm:max-w-xl"
        showCloseButton={false}
      >
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Search className="text-muted-foreground size-5 shrink-0" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Cari buku, guru, siswa, jadwal, pengumuman…"
            className="h-auto border-0 bg-transparent p-0 text-base shadow-none outline-none focus-visible:ring-0"
          />
          <kbd className="text-muted-foreground rounded border px-1.5 py-0.5 text-[10px]">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Mencari…
            </div>
          ) : query.trim().length < 2 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <p className="font-medium">SchoolHub Smart Search</p>
              <p className="mt-1 text-xs">
                Ketik minimal 2 karakter untuk mencari di seluruh SchoolHub.
              </p>
            </div>
          ) : flatItems.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <FileSearch className="text-muted-foreground size-8" />
              <p className="text-sm font-medium">Tidak ada hasil</p>
              <p className="text-muted-foreground text-xs">
                Tidak ditemukan data yang cocok dengan “{query}”.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <div key={group.category}>
                  <div className="text-muted-foreground mb-1 flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-wider">
                    <AchievementIcon name={group.icon} className="size-3.5" />
                    {group.category}
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const globalIndex = flatItems.findIndex(
                        (f) => f.item.id === item.id
                      );
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => navigate(item)}
                          onMouseEnter={() => setActiveIndex(globalIndex)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left",
                            activeIndex === globalIndex
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted"
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {item.title}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                              {item.subtitle}
                            </p>
                          </div>
                          <kbd className="text-muted-foreground shrink-0 text-[10px]">
                            ↵
                          </kbd>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
