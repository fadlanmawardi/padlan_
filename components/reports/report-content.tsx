"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, FileText, Printer } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { BarChart } from "@/components/shared/bar-chart";
import { DistributionList } from "@/components/shared/distribution-list";
import { PageLoader } from "@/components/shared/loading-screen";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import {
  getCategoryDistribution,
  getDashboardStats,
  getLoanChartData,
} from "@/services/dashboard-service";
import { getLoans } from "@/services/loan-service";
import type { ChartDatum, LoanRecord } from "@/types";

interface ReportData {
  stats: Awaited<ReturnType<typeof getDashboardStats>>;
  chart: ChartDatum[];
  distribution: Awaited<ReturnType<typeof getCategoryDistribution>>;
  loans: LoanRecord[];
}

function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ReportContent() {
  const [data, setData] = useState<ReportData | null>(null);

  useEffect(() => {
    void Promise.all([
      getDashboardStats(),
      getLoanChartData(),
      getCategoryDistribution(),
      getLoans(),
    ]).then(([stats, chart, distribution, loans]) =>
      setData({ stats, chart, distribution, loans })
    );
  }, []);

  if (!data) return <PageLoader />;

  const { stats, chart, distribution, loans } = data;

  const bookLoanCount = new Map<string, number>();
  const studentLoanCount = new Map<string, number>();
  for (const loan of loans) {
    bookLoanCount.set(loan.bookId, (bookLoanCount.get(loan.bookId) ?? 0) + 1);
    studentLoanCount.set(
      loan.studentId,
      (studentLoanCount.get(loan.studentId) ?? 0) + 1
    );
  }

  const topBooks = [...bookLoanCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([bookId, count]) => {
      const loan = loans.find((l) => l.bookId === bookId);
      return { bookId, title: loan?.bookTitle ?? "Buku", count };
    });

  const topStudents = [...studentLoanCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([studentId, count]) => {
      const loan = loans.find((l) => l.studentId === studentId);
      return { studentId, name: loan?.studentName ?? "Siswa", count };
    });

  const recentLoans = loans.slice(0, 10);

  function handleExportLoans() {
    downloadCSV("laporan-peminjaman.csv", [
      ["Kode", "Buku", "Siswa", "Dipinjam", "Jatuh Tempo", "Status"],
      ...recentLoans.map((loan) => [
        loan.id,
        loan.bookTitle,
        loan.studentName,
        formatDate(loan.borrowedAt),
        formatDate(loan.dueAt),
        loan.status,
      ]),
    ]);
    toast.success("Laporan peminjaman diunduh");
  }

  function handleExportSummary() {
    downloadCSV("ringkasan-perpustakaan.csv", [
      ["Metrik", "Nilai"],
      ["Total Buku", stats.totalBooks],
      ["Total Siswa", stats.totalStudents],
      ["Total Admin", stats.totalAdmins],
      ["Buku Dipinjam", stats.borrowedBooks],
      ["Buku Tersedia", stats.availableBooks],
      ["Total Denda", stats.totalFines],
      ["Denda Belum Dibayar", stats.unpaidFines],
    ]);
    toast.success("Ringkasan diunduh");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan"
        description="Rekap dan analisis data perpustakaan."
        actions={
          <>
            <Button variant="outline" onClick={handleExportSummary}>
              <Download className="size-4" />
              Ringkasan CSV
            </Button>
            <Button variant="outline" onClick={handleExportLoans}>
              <FileText className="size-4" />
              Peminjaman CSV
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="size-4" />
              Cetak
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Total Buku", value: stats.totalBooks },
          { label: "Total Siswa", value: stats.totalStudents },
          { label: "Total Admin", value: stats.totalAdmins },
          { label: "Buku Dipinjam", value: stats.borrowedBooks },
          { label: "Buku Tersedia", value: stats.availableBooks },
          { label: "Total Denda", value: stats.totalFines },
        ].map((item) => (
          <Card key={item.label} className="gap-0 py-0">
            <CardContent className="px-4 py-4">
              <p className="text-muted-foreground text-xs">{item.label}</p>
              <p className="mt-1 text-xl font-semibold">
                {item.value.toLocaleString("id-ID")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Grafik Peminjaman</CardTitle>
            <CardDescription>
              Tren peminjaman dan pengembalian 6 bulan terakhir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart data={chart} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Buku per Kategori</CardTitle>
            <CardDescription>Distribusi koleksi berdasarkan kategori.</CardDescription>
          </CardHeader>
          <CardContent>
            <DistributionList data={distribution} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Buku Terpopuler</CardTitle>
            <CardDescription>Buku paling sering dipinjam.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Peringkat</TableHead>
                  <TableHead>Judul Buku</TableHead>
                  <TableHead className="text-right">Dipinjam</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topBooks.map((book, index) => (
                  <TableRow key={book.bookId}>
                    <TableCell className="text-muted-foreground">
                      #{index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{book.title}</TableCell>
                    <TableCell className="text-right font-medium">
                      {book.count}×
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Siswa Paling Aktif</CardTitle>
            <CardDescription>Siswa dengan peminjaman terbanyak.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Peringkat</TableHead>
                  <TableHead>Nama Siswa</TableHead>
                  <TableHead className="text-right">Peminjaman</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topStudents.map((student, index) => (
                  <TableRow key={student.studentId}>
                    <TableCell className="text-muted-foreground">
                      #{index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell className="text-right font-medium">
                      {student.count}×
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaksi Terbaru</CardTitle>
          <CardDescription>10 peminjaman terakhir yang tercatat.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Buku</TableHead>
                <TableHead>Siswa</TableHead>
                <TableHead>Dipinjam</TableHead>
                <TableHead>Jatuh Tempo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLoans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell>
                    <span className="font-mono text-xs">{loan.id}</span>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-56 truncate font-medium">
                      {loan.bookTitle}
                    </p>
                  </TableCell>
                  <TableCell>{loan.studentName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(loan.borrowedAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(loan.dueAt)}
                  </TableCell>
                  <TableCell className="capitalize">{loan.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
