"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Megaphone, Pencil, Pin, Plus, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
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
import { relativeTime } from "@/lib/format";
import {
  ANNOUNCEMENT_META,
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  updateAnnouncement,
} from "@/services/community-service";
import type { AnnouncementPriority, AnnouncementRecord } from "@/types";

const PRIORITIES = Object.keys(ANNOUNCEMENT_META) as AnnouncementPriority[];

interface AnnouncementForm {
  title: string;
  content: string;
  priority: AnnouncementPriority;
  pinned: boolean;
}

const EMPTY_FORM: AnnouncementForm = {
  title: "",
  content: "",
  priority: "normal",
  pinned: false,
};

export function AnnouncementsView() {
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[] | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AnnouncementRecord | null>(null);
  const [form, setForm] = useState<AnnouncementForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const list = await getAnnouncements();
    setAnnouncements(list);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(announcement: AnnouncementRecord) {
    setEditing(announcement);
    setForm({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      pinned: announcement.pinned,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error("Judul pengumuman wajib diisi");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateAnnouncement(editing.id, {
          title: form.title.trim(),
          content: form.content,
          priority: form.priority,
          pinned: form.pinned,
        });
        toast.success("Pengumuman diperbarui");
      } else {
        await createAnnouncement({
          title: form.title.trim(),
          content: form.content,
          authorId: user?.uid ?? "",
          priority: form.priority,
          pinned: form.pinned,
        });
        toast.success("Pengumuman dibuat");
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
      await deleteAnnouncement(deleteTarget.id);
      toast.success("Pengumuman dihapus");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  async function togglePin(announcement: AnnouncementRecord) {
    await updateAnnouncement(announcement.id, { pinned: !announcement.pinned });
    toast.success(announcement.pinned ? "Tidak lagi disematkan" : "Disematkan");
    await load();
  }

  if (!announcements) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengumuman"
        description="Informasi resmi dari sekolah."
        actions={
          !isStudent && (
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Buat Pengumuman
            </Button>
          )
        }
      />

      {announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Belum ada pengumuman"
          description="Pengumuman akan tampil di sini."
        />
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => {
            const meta = ANNOUNCEMENT_META[announcement.priority];
            return (
              <Card
                key={announcement.id}
                className={announcement.pinned ? "border-primary/30 bg-primary/[0.03]" : "gap-0 py-0"}
              >
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={`${meta.className} flex size-10 shrink-0 items-center justify-center rounded-lg`}
                      >
                        <Megaphone className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{announcement.title}</h3>
                          <Badge className={meta.className}>{meta.label}</Badge>
                          {announcement.pinned && (
                            <Badge variant="outline">
                              <Pin className="size-3" />
                              Disematkan
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {announcement.authorName} ·{" "}
                          {relativeTime(announcement.createdAt)}
                        </p>
                      </div>
                    </div>
                    {!isStudent && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => void togglePin(announcement)}
                          aria-label="Sematkan"
                        >
                          <Pin className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => openEdit(announcement)}
                          aria-label="Edit"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive"
                          onClick={() => setDeleteTarget(announcement)}
                          aria-label="Hapus"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-3 whitespace-pre-line text-sm">
                    {announcement.content}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Pengumuman" : "Buat Pengumuman"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Judul</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Judul pengumuman"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Prioritas</Label>
                <Select
                  value={form.priority}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      priority: value as AnnouncementPriority,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {ANNOUNCEMENT_META[priority].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2 pb-2">
                <Switch
                  id="pinned"
                  checked={form.pinned}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, pinned: checked }))
                  }
                />
                <Label htmlFor="pinned" className="text-sm">
                  Sematkan di atas
                </Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Isi</Label>
              <Textarea
                value={form.content}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, content: e.target.value }))
                }
                rows={4}
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
        title="Hapus pengumuman"
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
