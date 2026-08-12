"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportCsv, exportPdf, type ExportColumn } from "@/lib/export";

interface ExportButtonProps {
  filename: string;
  title: string;
  columns: ExportColumn[];
  rows: string[][];
  disabled?: boolean;
}

export function ExportButton({
  filename,
  title,
  columns,
  rows,
  disabled,
}: ExportButtonProps) {
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);

  async function handleExport(format: "csv" | "pdf") {
    setExporting(format);
    await new Promise((resolve) => setTimeout(resolve, 350));
    try {
      if (format === "csv") {
        exportCsv(filename, columns.map((col) => col.header), rows);
        toast.success("File Excel (CSV) berhasil diunduh");
      } else {
        exportPdf(filename, title, columns, rows);
        toast.success("File PDF berhasil diunduh");
      }
    } catch {
      toast.error("Gagal membuat file export");
    } finally {
      setExporting(null);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || exporting !== null}>
          {exporting && <Loader2 className="size-4 animate-spin" />}
          {!exporting && <Download className="size-4" />}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Unduh data ini</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void handleExport("csv")}>
          <FileSpreadsheet className="text-success size-4" />
          Excel (.csv)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void handleExport("pdf")}>
          <FileText className="text-destructive size-4" />
          PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
