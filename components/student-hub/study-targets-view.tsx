"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, CheckCircle2, Minus, Plus, Target, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { formatDate } from "@/lib/format";
import {
  createStudyTarget,
  deleteStudyTarget,
  getStudentTargets,
  updateStudyTargetProgress,
} from "@/services/student-hub-service";
import type { StudyTarget } from "@/types";

interface TargetForm {
  title: string;
  goal: number;
  unit: string;
  deadline: string;
}

const EMPTY_FORM: TargetForm = {
  title: "",
  goal: 10,
  unit: "halaman",
  deadline: "",
};

export function StudyTargetsView() {
  const { user } = useAuth();
  const [targets, setTargets] = useState<StudyTarget[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<TargetForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StudyTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const list = await getStudentTargets(user.uid);
    setTargets(list);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave() {
    if (!user) return;
    if (!form.title.trim()) {
      toast.error("Judul target wajib diisi");
      return;
    }
    setSaving(true);
    try {
      await createStudyTarget({
        studentId: user.uid,
        title: form.title.trim(),
        goal: form.goal,
        unit: form.unit,
        deadline: form.deadline || undefined,
      });
      toast.success("Target dibuat");
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function handleProgress(target: StudyTarget, delta: number) {
    await updateStudyTargetProgress(target.id, delta);
    await load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteStudyTarget(deleteTarget.id);
      toast.success("Target dihapus");
      await load();
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  if (!targets) return <PageLoader />;

  const doneCount = targets.filter((t) => t.done).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Target Belajar"
        description={`Pantau target belajarmu. ${doneCount}/${targets.length} selesai.`}
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            Target Baru
          </Button>
        }
      />

      {targets.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Belum ada target"
          description="Tetapkan target belajar untuk memotivasimu."
        />
      ) : (
        <div className="space-y-3">
          {targets.map((target) => {
            const pct = target.goal > 0
              ? Math.min(100, Math.round((target.progress / target.goal) * 100))
              : 0;
            return (
              <Card
                key={target.id}
                className={`gap-0 py-0 ${target.done ? "border-success/40 bg-success/[0.04]" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Checkbox
                      checked={target.done}
                      onCheckedChange={() => void handleProgress(target, target.goal - target.progress)}
                      aria-label="Tandai selesai"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={`font-medium ${
                            target.done ? "text-muted-foreground line-through" : ""
                          }`}
                        >
                          {target.title}
                        </p>
                        {target.done && (
                          <Badge variant="successSoft">
                            <CheckCircle2 className="size-3" />
                            Selesai
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="bg-muted h-2 min-w-24 flex-1 overflow-hidden rounded-full">
                          <div
                            className="bg-primary h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-muted-foreground text-xs tabular-nums">
                          {target.progress}/{target.goal} {target.unit} · {pct}%
                        </span>
                      </div>
                      {target.deadline && (
                        <p className="text-muted-foreground mt-1.5 flex items-center gap-1 text-xs">
                          <CalendarDays className="size-3" />
                          Target selesai: {formatDate(target.deadline)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        disabled={target.progress <= 0}
                        onClick={() => void handleProgress(target, -1)}
                        aria-label="Kurangi"
                      >
                        <Minus className="size-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        disabled={target.progress >= target.goal}
                        onClick={() => void handleProgress(target, 1)}
                        aria-label="Tambah"
                      >
                        <Plus className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        onClick={() => setDeleteTarget(target)}
                        aria-label="Hapus"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Target Belajar Baru</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Judul</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Mis. Membaca buku Matematika"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Target</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.goal}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      goal: Number(e.target.value) || 1,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Satuan</Label>
                <Input
                  value={form.unit}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, unit: e.target.value }))
                  }
                  placeholder="halaman / soal / hari"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Batas waktu (opsional)</Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, deadline: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Hapus target"
        description={`Hapus "${deleteTarget?.title ?? ""}"?`}
        confirmLabel="Hapus"
        loading={deleting}
        onOpenChange={(open) => {
          if (!deleting) setDeleteTarget(open ? deleteTarget : null);
        }}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
