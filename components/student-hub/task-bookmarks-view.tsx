"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Bookmark, BookMarked, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-screen";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/components/auth/auth-provider";
import { daysUntil, relativeTime } from "@/lib/format";
import {
  getStudentBookmarks,
  toggleBookmark,
} from "@/services/student-hub-service";
import type { BookmarkView } from "@/services/student-hub-service";

export function TaskBookmarksView() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkView[] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BookmarkView | null>(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const list = await getStudentBookmarks(user.uid);
    setBookmarks(list);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRemove() {
    if (!user || !deleteTarget) return;
    setRemoving(true);
    try {
      await toggleBookmark(user.uid, deleteTarget.assignmentId);
      toast.success("Bookmark dihapus");
      await load();
    } finally {
      setRemoving(false);
      setDeleteTarget(null);
    }
  }

  if (!bookmarks) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookmark Tugas"
        description="Tugas penting yang kamu simpan."
      />

      {bookmarks.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Belum ada bookmark"
          description="Simpan tugas penting lewat ikon bookmark di halaman tugas."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {bookmarks.map((bookmark) => {
            const dayLeft = daysUntil(bookmark.deadline);
            return (
              <Card key={bookmark.bookmarkId} className="gap-0 py-0">
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                    <BookMarked className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{bookmark.title}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {bookmark.subject} · disimpan {relativeTime(bookmark.createdAt)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge
                        variant={dayLeft < 0 ? "destructive" : dayLeft <= 3 ? "warningSoft" : "secondary"}
                      >
                        {dayLeft < 0
                          ? "Terlewat"
                          : dayLeft === 0
                            ? "Hari ini"
                            : `${dayLeft} hari lagi`}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-destructive"
                    onClick={() => setDeleteTarget(bookmark)}
                    aria-label="Hapus bookmark"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Hapus bookmark"
        description={`Hapus "${deleteTarget?.title ?? ""}" dari bookmark?`}
        confirmLabel="Hapus"
        loading={removing}
        onOpenChange={(open) => {
          if (!removing) setDeleteTarget(open ? deleteTarget : null);
        }}
        onConfirm={() => void handleRemove()}
      />
    </div>
  );
}
