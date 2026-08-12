"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardPen,
  Clock3,
  FileText,
  MessageSquareText,
  Users,
} from "lucide-react";
import { PageLoader } from "@/components/shared/loading-screen";
import { CollectionStatusBadge } from "@/components/shared/status-badges";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTime, getInitials } from "@/lib/format";
import { getCollection, gradeSubmission } from "@/services/assignment-service";
import type { AssignmentRecord, CollectionView } from "@/types";
import { cn } from "@/lib/utils";

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone: "primary" | "success" | "warning" | "danger";
}) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex items-center gap-3 px-4 py-3.5">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            tone === "primary" && "bg-primary/10 text-primary",
            tone === "success" && "bg-success/10 text-success",
            tone === "warning" && "bg-warning/15 text-warning",
            tone === "danger" && "bg-destructive/10 text-destructive"
          )}
        >
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-muted-foreground text-xs">{label}</p>
          <p className="text-lg leading-tight font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function GradeBadge({ grade }: { grade: number }) {
  return (
    <Badge
      variant={
        grade >= 90 ? "success" : grade >= 75 ? "infoSoft" : grade >= 60 ? "warningSoft" : "dangerSoft"
      }
      className="min-w-12 justify-center font-semibold"
    >
      {grade}
    </Badge>
  );
}

export function AssignmentSubmissions({
  assignment,
}: {
  assignment: AssignmentRecord;
}) {
  const [collection, setCollection] = useState<CollectionView[] | null>(null);
  const [grading, setGrading] = useState<CollectionView | null>(null);
  const [gradeInput, setGradeInput] = useState("");
  const [commentInput, setCommentInput] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setCollection(await getCollection(assignment.id));
  }, [assignment.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const list = collection ?? [];
    const graded = list.filter(
      (c) => c.submission?.status === "submitted" && c.submission.grade !== undefined
    ).length;
    return {
      total: list.length,
      submitted: list.filter((c) => c.status === "submitted").length,
      late: list.filter((c) => c.status === "late").length,
      notCollected: list.filter((c) => c.status === "not_collected").length,
      graded,
    };
  }, [collection]);

  if (!collection) return <PageLoader />;

  const progress =
    stats.total > 0
      ? Math.round(((stats.submitted + stats.late) / stats.total) * 100)
      : 0;

  function openGrade(item: CollectionView) {
    setGrading(item);
    setGradeInput(item.submission?.grade?.toString() ?? "");
    setCommentInput(item.submission?.gradeComment ?? "");
  }

  async function handleSaveGrade() {
    if (!grading) return;
    const value = gradeInput.trim();
    const parsed = value === "" ? undefined : Number(value);
    if (parsed !== undefined && (Number.isNaN(parsed) || parsed < 0 || parsed > 100)) {
      toast.error("Nilai harus berupa angka antara 0 sampai 100");
      return;
    }
    setSaving(true);
    try {
      await gradeSubmission({
        assignmentId: assignment.id,
        studentId: grading.studentId,
        grade: parsed,
        gradeComment: commentInput.trim() || undefined,
      });
      toast.success(`Nilai untuk ${grading.studentName} disimpan`);
      setGrading(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan nilai");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight">
            {assignment.title}
          </h2>
          <Badge variant="secondary">{assignment.subject}</Badge>
          <Badge variant="secondary">{assignment.className}</Badge>
        </div>
        <p className="text-muted-foreground text-sm">{assignment.description}</p>
        <p className="text-muted-foreground text-xs">
          Deadline: {formatDateTime(assignment.deadline)} · Guru:{" "}
          {assignment.teacherName}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Siswa"
          value={stats.total}
          tone="primary"
        />
        <StatCard
          icon={CheckCircle2}
          label="Sudah Dikumpulkan"
          value={stats.submitted}
          tone="success"
        />
        <StatCard
          icon={Clock3}
          label="Terlambat"
          value={stats.late}
          tone="warning"
        />
        <StatCard
          icon={AlertCircle}
          label="Belum Mengumpulkan"
          value={stats.notCollected}
          tone="danger"
        />
      </div>

      <Card className="gap-0 py-0">
        <CardContent className="px-0 py-0">
          <div className="space-y-2 border-b p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progres pengumpulan</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              {stats.graded} dari {stats.submitted} pengumpulan sudah dinilai.
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Siswa</TableHead>
                <TableHead>Lampiran</TableHead>
                <TableHead>Waktu Pengumpulan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Nilai</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collection.map((item) => {
                const submitted =
                  item.submission?.status === "submitted";
                const hasGrade =
                  submitted && item.submission?.grade !== undefined;
                return (
                  <TableRow key={item.studentId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-success/10 text-success text-xs font-semibold">
                            {getInitials(item.studentName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {item.studentName}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">
                            {item.nis || "-"} · {item.className || "-"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.submission?.fileName ? (
                        <span className="flex max-w-52 items-center gap-1.5 text-sm text-muted-foreground">
                          <FileText className="size-3.5 shrink-0" />
                          <span className="truncate">
                            {item.submission.fileName}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                      {item.submission?.gradeComment && hasGrade && (
                        <span className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                          <MessageSquareText className="size-3 shrink-0" />
                          <span className="max-w-40 truncate">
                            {item.submission.gradeComment}
                          </span>
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.submission?.submittedAt
                        ? formatDateTime(item.submission.submittedAt)
                        : item.submission?.status === "draft"
                          ? "Draft"
                          : "-"}
                    </TableCell>
                    <TableCell>
                      <CollectionStatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="text-center">
                      {hasGrade ? (
                        <GradeBadge grade={item.submission!.grade!} />
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          -
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!submitted}
                        onClick={() => openGrade(item)}
                      >
                        <ClipboardPen className="size-4" />
                        {hasGrade ? "Edit Nilai" : "Beri Nilai"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(grading)}
        onOpenChange={(open) => {
          if (!saving) setGrading(open ? grading : null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Penilaian · {grading?.studentName}
            </DialogTitle>
            <DialogDescription>
              {assignment.title} · {assignment.subject}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="grade-input">Nilai (0–100)</Label>
              <Input
                id="grade-input"
                type="number"
                min={0}
                max={100}
                value={gradeInput}
                onChange={(e) => setGradeInput(e.target.value)}
                placeholder="cth. 85"
              />
              <p className="text-muted-foreground text-xs">
                Kosongkan untuk menghapus nilai.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade-comment">Komentar (opsional)</Label>
              <Textarea
                id="grade-comment"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Tulis komentar untuk siswa…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGrading(null)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button onClick={handleSaveGrade} disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan Nilai"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
