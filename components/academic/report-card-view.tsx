"use client";

import { useCallback, useEffect, useState } from "react";
import { Printer, ScrollText, UserRound } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-screen";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/components/auth/auth-provider";
import { CLASS_OPTIONS } from "@/lib/constants";
import { KKM, gradePredicateLabel, isPassed } from "@/lib/academics";
import {
  getStudentReportCard,
  type ReportCardData,
} from "@/services/academic-service";
import { getStudents } from "@/services/user-service";
import type { AppUser } from "@/types";

export function ReportCardView() {
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  const [report, setReport] = useState<ReportCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<AppUser[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>(CLASS_OPTIONS[0]);
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const loadStudentCard = useCallback(
    async (studentId: string) => {
      setLoading(true);
      try {
        const data = await getStudentReportCard(studentId);
        setReport(data);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!isStudent) return;
    if (!user) return;
    void loadStudentCard(user.uid);
  }, [isStudent, user, loadStudentCard]);

  useEffect(() => {
    if (isStudent) return;
    let active = true;
    async function load() {
      const studentList = await getStudents();
      if (!active) return;
      setStudents(studentList);
      const firstInClass = studentList.find((s) => s.className === selectedClass);
      const uid = firstInClass?.uid ?? studentList[0]?.uid ?? "";
      setSelectedStudentId(uid);
      if (uid) {
        await loadStudentCard(uid);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [isStudent, selectedClass, loadStudentCard]);

  if (isStudent) {
    if (loading) return <PageLoader />;
    if (!report) {
      return (
        <div className="space-y-6">
          <PageHeader title="Rapor" description="Rapor digital kamu." />
          <EmptyState
            icon={ScrollText}
            title="Belum ada rapor"
            description="Rapor akan tersedia setelah nilai diinput."
          />
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <PageHeader
          title="Rapor"
          description="Laporan hasil belajar siswa."
          actions={
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="size-4" />
              Cetak
            </Button>
          }
        />
        <ReportCardDocument report={report} />
      </div>
    );
  }

  if (loading) return <PageLoader />;
  if (!report) {
    return (
      <div className="space-y-6">
        <PageHeader title="Rapor" description="Lihat rapor siswa." />
        <EmptyState
          icon={ScrollText}
          title="Belum ada rapor"
          description="Pilih siswa untuk melihat rapor."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapor"
        description="Lihat rapor setiap siswa."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLASS_OPTIONS.map((className) => (
                  <SelectItem key={className} value={className}>
                    {className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedStudentId}
              onValueChange={(value) => void loadStudentCard(value)}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Pilih siswa" />
              </SelectTrigger>
              <SelectContent>
                {students
                  .filter((s) => s.className === selectedClass)
                  .map((student) => (
                    <SelectItem key={student.uid} value={student.uid}>
                      {student.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="size-4" />
              Cetak
            </Button>
          </div>
        }
      />
      <ReportCardDocument report={report} />
    </div>
  );
}

function ReportCardDocument({ report }: { report: ReportCardData }) {
  return (
    <Card className="print:border-none print:shadow-none">
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col items-center gap-1 border-b pb-6 text-center">
          <h3 className="text-lg font-semibold">LAPORAN HASIL BELAJAR</h3>
          <p className="text-muted-foreground text-sm">SchoolHub · Tahun Ajaran 2025/2026</p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-full">
              <UserRound className="size-5" />
            </div>
            <div>
              <p className="font-semibold">{report.studentName}</p>
              <p className="text-muted-foreground text-xs">
                NIS {report.nis ?? "-"} · {report.className}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-start gap-3 sm:justify-end">
            <div className="text-right">
              <p className="text-muted-foreground text-xs">Rata-rata</p>
              <p className="text-2xl font-semibold">{report.totalAverage}</p>
            </div>
            <Badge
              variant={report.status === "lulus" ? "success" : "destructive"}
              className="text-xs"
            >
              {report.status === "lulus" ? "Tuntas" : "Belum Tuntas"}
            </Badge>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mata Pelajaran</TableHead>
                <TableHead>Guru</TableHead>
                {report.rows[0]?.scores.map((score) => (
                  <TableHead key={score.type} className="text-center">
                    {score.label}
                  </TableHead>
                ))}
                <TableHead className="text-center">Rata-rata</TableHead>
                <TableHead className="text-center">Predikat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.rows.map((row) => (
                <TableRow key={row.subjectId}>
                  <TableCell>
                    <span
                      className="inline-flex items-center gap-1.5 font-medium"
                      style={{ color: row.color }}
                    >
                      <span
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      {row.subjectName}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.teacherName}
                  </TableCell>
                  {row.scores.map((score) => (
                    <TableCell
                      key={score.type}
                      className={isPassed(score.score) ? "text-center" : "text-destructive text-center"}
                    >
                      {score.score}
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-semibold">
                    {row.average}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={row.passed ? "successSoft" : "dangerSoft"}
                    >
                      {row.predicate} · {gradePredicateLabel(row.predicate)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 flex flex-col gap-2 rounded-lg border bg-muted/40 p-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            KKM: <span className="font-semibold text-foreground">{KKM}</span>
          </p>
          <p>
            Predikat keseluruhan:{" "}
            <span className="font-semibold text-foreground">
              {report.overallPredicate} · {gradePredicateLabel(report.overallPredicate)}
            </span>
          </p>
          <p>
            Status:{" "}
            <span className="font-semibold text-foreground">
              {report.status === "lulus" ? "Tuntas" : "Belum Tuntas"}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
