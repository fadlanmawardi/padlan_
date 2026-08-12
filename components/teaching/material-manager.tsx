"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Download,
  ExternalLink,
  FolderOpen,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { relativeTime, formatDate } from "@/lib/format";
import {
  createMaterial,
  deleteMaterial,
  getMaterials,
  updateMaterial,
  MATERIAL_META,
} from "@/services/teacher-content-service";
import { getSubjects } from "@/services/academic-service";
import type { MaterialRecord, MaterialType, SubjectRecord } from "@/types";

const MATERIAL_TYPES = Object.keys(MATERIAL_META) as MaterialType[];

interface MaterialForm {
  title: string;
  description: string;
  subjectId: string;
  type: MaterialType;
  fileName: string;
  url: string;
  sizeKb: string;
}

const EMPTY_FORM: MaterialForm = {
  title: "",
  description: "",
  subjectId: "",
  type: "pdf",
  fileName: "",
  url: "",
  sizeKb: "",
};

export function MaterialManager() {
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  const [materials, setMaterials] = useState<MaterialRecord[] | null>(null);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialRecord | null>(null);
  const [form, setForm] = useState<MaterialForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MaterialRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const [materialList, subjectList] = await Promise.all([
      getMaterials(),
      getSubjects(),
    ]);
    setMaterials(materialList);
    setSubjects(subjectList);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, subjectId: subjects[0]?.id ?? "" });
    setDialogOpen(true);
  }

  function openEdit(material: MaterialRecord) {
    setEditing(material);
    setForm({
      title: material.title,
      description: material.description ?? "",
      subjectId: material.subjectId,
      type: material.type,
      fileName: material.fileName ?? "",
      url: material.url ?? "",
      sizeKb: material.sizeKb !== undefined ? String(material.sizeKb) : "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error("Judul materi wajib diisi");
      return;
    }
    if (!form.subjectId) {
      toast.error("Pilih mata pelajaran");
      return;
    }
    if (!form.fileName.trim() && !form.url.trim()) {
      toast.error("Isi nama file atau URL materi");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        subjectId: form.subjectId,
        teacherId: user?.uid ?? "",
        type: form.type,
        fileName: form.fileName.trim() || undefined,
        url: form.url.trim() || undefined,
        sizeKb: form.sizeKb ? Number(form.sizeKb) : undefined,
      };
      if (editing) {
        await updateMaterial(editing.id, payload);
        toast.success("Materi diperbarui");
      } else {
        await createMaterial(payload);
        toast.success("Materi ditambahkan");
      }
      setDialogOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan materi");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMaterial(deleteTarget.id);
      toast.success("Materi dihapus");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus materi");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  const filtered = (materials ?? []).filter(
    (material) => subjectFilter === "all" || material.subjectId === subjectFilter
  );

  if (!materials) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Materi Pembelajaran"
        description="Bagikan materi dan media pembelajaran ke siswa."
        actions={
          !isStudent && (
            <div className="flex items-center gap-2">
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Semua mapel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua mapel</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={openCreate}>
                <Plus className="size-4" />
                Tambah Materi
              </Button>
            </div>
          )
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Belum ada materi"
          description="Materi pembelajaran akan tampil di sini."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((material) => {
            const meta = MATERIAL_META[material.type];
            return (
              <Card key={material.id} className="gap-0 py-0">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex size-11 shrink-0 items-center justify-center rounded-lg text-white"
                      style={{ backgroundColor: meta.color }}
                    >
                      <span className="text-xs font-bold">{meta.label}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 font-semibold">{material.title}</h3>
                      <p className="text-muted-foreground text-xs">
                        {material.subjectName} · {material.teacherName}
                      </p>
                    </div>
                  </div>
                  {material.description && (
                    <p className="text-muted-foreground mt-3 line-clamp-2 text-sm">
                      {material.description}
                    </p>
                  )}
                  <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-3 text-xs">
                    <span>{material.fileName ?? "Tautan materi"}</span>
                    {material.sizeKb !== undefined && (
                      <span>{Math.round(material.sizeKb / 1024)} MB</span>
                    )}
                    <span>{relativeTime(material.createdAt)}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {material.url ? (
                        <Button size="sm" variant="outline" asChild>
                          <a
                            href={material.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink className="size-4" />
                            Buka
                          </a>
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled>
                          <Download className="size-4" />
                          Unduh
                        </Button>
                      )}
                      {!isStudent && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => openEdit(material)}
                            aria-label="Edit"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive"
                            onClick={() => setDeleteTarget(material)}
                            aria-label="Hapus"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {formatDate(material.createdAt)}
                    </Badge>
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
            <DialogTitle>{editing ? "Edit Materi" : "Tambah Materi"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Judul</Label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Misal: Bab 1 – Pengenalan Aljabar"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipe</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, type: value as MaterialType }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAL_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {MATERIAL_META[type].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Mata Pelajaran</Label>
              <Select
                value={form.subjectId}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, subjectId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih mapel" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Nama File</Label>
                <Input
                  value={form.fileName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, fileName: e.target.value }))
                  }
                  placeholder="Modul_Aljabar.pdf"
                />
              </div>
              <div className="space-y-2">
                <Label>Ukuran (KB)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.sizeKb}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, sizeKb: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={form.url}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, url: e.target.value }))
                }
                placeholder="https://… (opsional)"
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
        title="Hapus materi"
        description={`Hapus materi "${deleteTarget?.title ?? ""}"?`}
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
