"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { NotebookPen, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";
import {
  createStudyNote,
  deleteStudyNote,
  getStudentNotes,
  NOTE_COLORS,
  updateStudyNote,
} from "@/services/student-hub-service";
import type { StudyNote } from "@/types";

interface NoteForm {
  title: string;
  content: string;
  color: string;
}

const EMPTY_FORM: NoteForm = { title: "", content: "", color: NOTE_COLORS[0] };

export function StudyNotesView() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<StudyNote[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StudyNote | null>(null);
  const [form, setForm] = useState<NoteForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StudyNote | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const list = await getStudentNotes(user.uid);
    setNotes(list);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(note: StudyNote) {
    setEditing(note);
    setForm({
      title: note.title,
      content: note.content,
      color: note.color,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!user) return;
    if (!form.title.trim()) {
      toast.error("Judul catatan wajib diisi");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateStudyNote(editing.id, form);
        toast.success("Catatan diperbarui");
      } else {
        await createStudyNote({ studentId: user.uid, ...form });
        toast.success("Catatan dibuat");
      }
      setDialogOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteStudyNote(deleteTarget.id);
      toast.success("Catatan dihapus");
      await load();
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  if (!notes) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catatan Belajar"
        description="Simpan ringkasan materi dan ide belajarmu."
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Catatan Baru
          </Button>
        }
      />

      {notes.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="Belum ada catatan"
          description="Buat catatan pertamamu untuk belajar lebih teratur."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group relative overflow-hidden rounded-xl border p-4 transition-all hover:shadow-sm"
              style={{ background: `${note.color}0d` }}
            >
              <span
                className="absolute inset-x-0 top-0 h-1"
                style={{ backgroundColor: note.color }}
              />
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 pr-2 font-semibold">{note.title}</h3>
                <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => openEdit(note)}
                    aria-label="Edit"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive"
                    onClick={() => setDeleteTarget(note)}
                    aria-label="Hapus"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground mt-2 line-clamp-4 text-sm whitespace-pre-line">
                {note.content}
              </p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Catatan" : "Catatan Baru"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Judul</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Judul catatan"
              />
            </div>
            <div className="space-y-2">
              <Label>Isi</Label>
              <Textarea
                value={form.content}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, content: e.target.value }))
                }
                rows={5}
                placeholder="Tulis catatanmu di sini…"
              />
            </div>
            <div className="space-y-2">
              <Label>Warna</Label>
              <div className="flex gap-2">
                {NOTE_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, color }))}
                    className={cn(
                      "size-7 rounded-full transition-transform",
                      form.color === color &&
                        "ring-ring ring-2 ring-offset-2 scale-110"
                    )}
                    style={{ backgroundColor: color }}
                    aria-label={`Warna ${color}`}
                  />
                ))}
              </div>
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
        title="Hapus catatan"
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
