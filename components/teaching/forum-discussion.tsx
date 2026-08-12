"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  MessagesSquare,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/components/auth/auth-provider";
import { getInitials, relativeTime } from "@/lib/format";
import {
  createForumPost,
  createForumThread,
  deleteForumThread,
  getForumPosts,
  getForumThreads,
} from "@/services/teacher-content-service";
import { getAssignments } from "@/services/assignment-service";
import type { AssignmentRecord, ForumPost, ForumThreadRecord } from "@/types";

export function ForumDiscussion() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ForumThreadRecord[] | null>(null);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [selected, setSelected] = useState<ForumThreadRecord | null>(null);
  const [posts, setPosts] = useState<ForumPost[] | null>(null);
  const [postText, setPostText] = useState("");
  const [posting, setPosting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [threadTitle, setThreadTitle] = useState("");
  const [threadAssignmentId, setThreadAssignmentId] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ForumThreadRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadThreads = useCallback(async () => {
    const [threadList, assignmentList] = await Promise.all([
      getForumThreads(),
      getAssignments(),
    ]);
    setThreads(threadList);
    setAssignments(assignmentList);
  }, []);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  async function openThread(thread: ForumThreadRecord) {
    setSelected(thread);
    const list = await getForumPosts(thread.id);
    setPosts(list);
  }

  async function handlePost() {
    if (!postText.trim() || !user || !selected) return;
    setPosting(true);
    try {
      await createForumPost({
        threadId: selected.id,
        authorId: user.uid,
        authorName: user.name,
        content: postText,
      });
      setPostText("");
      const list = await getForumPosts(selected.id);
      setPosts(list);
      await loadThreads();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengirim pesan");
    } finally {
      setPosting(false);
    }
  }

  async function handleCreateThread() {
    if (!threadTitle.trim() || !user) {
      toast.error("Judul forum wajib diisi");
      return;
    }
    setCreating(true);
    try {
      await createForumThread({
        assignmentId: threadAssignmentId || (assignments[0]?.id ?? ""),
        title: threadTitle.trim(),
        authorId: user.uid,
        authorName: user.name,
      });
      toast.success("Forum diskusi dibuat");
      setDialogOpen(false);
      setThreadTitle("");
      await loadThreads();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membuat forum");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteThread() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteForumThread(deleteTarget.id);
      toast.success("Forum dihapus");
      if (selected?.id === deleteTarget.id) {
        setSelected(null);
        setPosts(null);
      }
      await loadThreads();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus forum");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  if (!threads) return <PageLoader />;

  if (selected) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={selected.title}
          description={`Diskusi tugas "${selected.assignmentTitle}"`}
          actions={
            <Button variant="outline" onClick={() => setSelected(null)}>
              <ArrowLeft className="size-4" />
              Kembali
            </Button>
          }
        />
        <Card>
          <CardContent className="space-y-4 p-5">
            {posts && posts.length === 0 ? (
              <EmptyState
                icon={MessagesSquare}
                title="Belum ada pesan"
                description="Jadilah yang pertama berdiskusi."
              />
            ) : (
              (posts ?? []).map((post) => (
                <div key={post.id} className="flex gap-3">
                  <Avatar className="size-9 shrink-0">
                    <AvatarFallback className="bg-primary/15 text-primary text-xs">
                      {getInitials(post.authorName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        {post.authorName}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {relativeTime(post.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed">{post.content}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-end gap-2 p-4">
            <Input
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="Tulis komentar atau jawaban…"
              onKeyDown={(e) => {
                if (e.key === "Enter") void handlePost();
              }}
            />
            <Button onClick={() => void handlePost()} disabled={posting || !postText.trim()}>
              <Send className="size-4" />
              {posting ? "Mengirim…" : "Kirim"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Forum Diskusi"
        description="Diskusikan tugas dan materi bersama teman dan guru."
        actions={
          user?.role !== "student" && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              Buat Forum
            </Button>
          )
        }
      />

      {threads.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="Belum ada forum"
          description="Forum diskusi akan tampil di sini."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {threads.map((thread) => (
            <Card
              key={thread.id}
              className="gap-0 py-0 transition-colors hover:border-primary/40"
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() => void openThread(thread)}
              >
                <CardHeader>
                  <CardTitle className="line-clamp-2 text-base">
                    {thread.title}
                  </CardTitle>
                  <p className="text-muted-foreground text-xs">
                    {thread.assignmentTitle}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground truncate">
                      {thread.authorName}
                    </span>
                    <Badge variant="infoSoft">{thread.postCount} pesan</Badge>
                  </div>
                  {thread.lastPostAt && (
                    <p className="text-muted-foreground mt-2 text-xs">
                      Terakhir aktif {relativeTime(thread.lastPostAt)}
                    </p>
                  )}
                </CardContent>
              </button>
              {user?.role !== "student" && (
                <div className="flex justify-end border-t px-4 py-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive"
                    onClick={() => setDeleteTarget(thread)}
                  >
                    <Trash2 className="size-3.5" />
                    Hapus
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Forum Diskusi</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Judul Forum</Label>
              <Input
                value={threadTitle}
                onChange={(e) => setThreadTitle(e.target.value)}
                placeholder="Misal: Diskusi tugas Persamaan Linear"
              />
            </div>
            <div className="space-y-2">
              <Label>Topik Tugas</Label>
              <Select
                value={threadAssignmentId}
                onValueChange={setThreadAssignmentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tugas" />
                </SelectTrigger>
                <SelectContent>
                  {assignments.map((assignment) => (
                    <SelectItem key={assignment.id} value={assignment.id}>
                      {assignment.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              disabled={creating}
            >
              Batal
            </Button>
            <Button onClick={handleCreateThread} disabled={creating}>
              {creating ? "Membuat…" : "Buat Forum"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Hapus forum"
        description={`Hapus forum "${deleteTarget?.title ?? ""}" beserta semua pesannya?`}
        confirmLabel="Hapus"
        loading={deleting}
        onOpenChange={(open) => {
          if (!deleting) setDeleteTarget(open ? deleteTarget : null);
        }}
        onConfirm={() => void handleDeleteThread()}
      />
    </div>
  );
}
