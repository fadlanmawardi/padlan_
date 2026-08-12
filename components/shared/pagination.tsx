"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  function pageItems(): (number | "…")[] {
    const pages = new Set<number>([1, totalPages]);
    for (let p = page - 1; p <= page + 1; p++) {
      if (p >= 1 && p <= totalPages) pages.add(p);
    }
    const sorted = [...pages].sort((a, b) => a - b);
    const result: (number | "…")[] = [];
    let prev = 0;
    for (const p of sorted) {
      if (p - prev > 1) result.push("…");
      result.push(p);
      prev = p;
    }
    return result;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground text-sm">
        Menampilkan{" "}
        <span className="font-medium text-foreground">
          {total === 0 ? 0 : startItem}–{endItem}
        </span>{" "}
        dari <span className="font-medium text-foreground">{total}</span> data
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={page === 1}
          onClick={() => onPageChange(1)}
          aria-label="Halaman pertama"
        >
          <ChevronsLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="size-4" />
        </Button>

        {pageItems().map((item, index) =>
          item === "…" ? (
            <span key={`ellipsis-${index}`} className="px-1 text-sm">
              …
            </span>
          ) : (
            <Button
              key={item}
              variant={item === page ? "default" : "outline"}
              size="icon"
              className={cn("size-8 text-xs")}
              onClick={() => onPageChange(item)}
            >
              {item}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={page === totalPages}
          onClick={() => onPageChange(totalPages)}
          aria-label="Halaman terakhir"
        >
          <ChevronsRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
