"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Presentation, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createRubric,
  deleteRubric,
  getRubrics,
  updateRubric,
} from "@/services/teacher-content-service";
import type { Rubric } from "@/types";

interface CriterionForm {
  label: string;
  maxScore: string;
}

interface RubricForm {
  title: string;
  description: string;
  criteria: CriterionForm[];
}

const EMPTY_CRITERION: CriterionForm = { label: "", maxScore: "25" };

function emptyForm(): RubricForm {
  return {
    title: "",
    description: "",
    criteria: [
      { label: "Isi", maxScore: "40" },
      { label: "Ketepatan", maxScore: "30" },
      { label: "Kerapihan", maxScore: "20" },
      { label: "Kreativitas", maxScore: "10" },
    ],
  };
}

export function RubricManager() {
  const [rubrics, setRubrics] = useState<Rubric[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Rubric | null>(null);
  const [form, setForm] = useState<RubricForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Rubric | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const list = await getRubrics();
    setRubrics(list);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(rubric: Rubric) {
    setEditing(rubric);
    setForm({
      title: rubric.title,
      description: rubric.description ?? "",
      criteria: rubric.criteria.map((c) => ({
        label: c.label,
        maxScore: String(c.maxScore),
      })),
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error("Judul rubrik wajib diisi");
      return;
    }
    const validCriteria = form.criteria
      .map((c) => ({
        label: c.label.trim(),
        maxScore: Number(c.maxScore),
      }))
      .filter((c) => c.label && !Number.isNaN(c.maxScore) && c.maxScore > 0);
    if (validCriteria.length === 0) {
      toast.error("Tambahkan minimal satu kriteria");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        criteria: validCriteria,
      };
      if (editing) {
        await updateRubric(editing.id, {
          title: payload.title,
          description: payload.description,
          criteria: validCriteria.map((c) => ({
            id: `c-${Math.random().toString(36).slice(2, 8)}`,
            ...c,
          })),
        });
        toast.success("Rubrik diperbarui");
      } else {
        await createRubric(payload);
        toast.success("Rubrik ditambahkan");
      }
      setDialogOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan rubrik");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRubric(deleteTarget.id);
      toast.success("Rubrik dihapus");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus rubrik");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  const totalMax = form.criteria.reduce(
    (sum, c) => sum + (Number(c.maxScore) || 0),
    0
  );

  if (!rubrics) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rubrik Penilaian"
        description="Kelola rubrik untuk penilaian tugas dan proyek."
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Tambah Rubrik
          </Button>
        }
      />

      {rubrics.length === 0 ? (
        <EmptyState
          icon={Presentation}
          title="Belum ada rubrik"
          description="Buat rubrik penilaian pertama kamu."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rubrics.map((rubric) => {
            const total = rubric.criteria.reduce((sum, c) => sum + c.maxScore, 0);
            return (
              <Card key={rubric.id} className="gap-0 py-0">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{rubric.title}</h3>
                      <p className="text-muted-foreground line-clamp-1 text-xs">
                        {rubric.description || "Tanpa deskripsi"}
                      </p>
                    </div>
                    <Badge variant="outline">Total {total}</Badge>
                  </div>
                  <div className="mt-4 space-y-2">
                    {rubric.criteria.map((criterion) => (
                      <div
                        key={criterion.id}
                        className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                      >
                        <span>{criterion.label}</span>
                        <span className="text-muted-foreground font-semibold">
                          {criterion.maxScore}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(rubric)}
                    >
                      <Pencil className="size-4" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setDeleteTarget(rubric)}
                    >
                      <Trash2 className="size-4" />
                      Hapus
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Rubrik" : "Tambah Rubrik"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Judul</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Misal: Rubrik Presentasi"
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={2}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Kriteria</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      criteria: [
                        ...prev.criteria,
                        { ...EMPTY_CRITERION },
                      ],
                    }))
                  }
                >
                  <Plus className="size-4" />
                  Tambah Kriteria
                </Button>
              </div>
              {form.criteria.map((criterion, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={criterion.label}
                    onChange={(e) => {
                      const criteria = [...form.criteria];
                      criteria[index].label = e.target.value;
                      setForm((prev) => ({ ...prev, criteria }));
                    }}
                    placeholder="Nama kriteria"
                  />
                  <Input
                    type="number"
                    min={1}
                    value={criterion.maxScore}
                    onChange={(e) => {
                      const criteria = [...form.criteria];
                      criteria[index].maxScore = e.target.value;
                      setForm((prev) => ({ ...prev, criteria }));
                    }}
                    className="w-24"
                    placeholder="Skor"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9 shrink-0 text-destructive"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        criteria: prev.criteria.filter((_, cIndex) => cIndex !== index),
                      }))
                    }
                    disabled={form.criteria.length === 1}
                    aria-label="Hapus kriteria"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <p className="text-muted-foreground text-xs">
                Total skor maksimal:{" "}
                <span className="font-semibold text-foreground">{totalMax}</span>
              </p>
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
        title="Hapus rubrik"
        description={`Hapus rubrik "${deleteTarget?.title ?? ""}"?`}
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
