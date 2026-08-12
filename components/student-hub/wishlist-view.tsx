"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { BookMarked, Heart } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-screen";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StarRating } from "@/components/shared/star-rating";
import { useAuth } from "@/components/auth/auth-provider";
import { getWishlistBooks, toggleWishlist } from "@/services/library-extra-service";
import type { BookRecordExtra } from "@/types";

export function WishlistView() {
  const { user } = useAuth();
  const [books, setBooks] = useState<BookRecordExtra[] | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const list = await getWishlistBooks(user.uid);
    setBooks(list);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRemove(bookId: string) {
    if (!user) return;
    await toggleWishlist(user.uid, bookId);
    toast.success("Dihapus dari wishlist");
    await load();
  }

  if (!books) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wishlist Buku"
        description="Buku favorit yang ingin kamu pinjam nanti."
      />

      {books.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Wishlist masih kosong"
          description="Tambahkan buku ke wishlist dari katalog perpustakaan."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <Card key={book.id} className="gap-0 py-0">
              <CardHeader className="flex flex-row items-start gap-4">
                <div className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-lg">
                  <BookMarked className="size-6" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <CardTitle className="line-clamp-2 text-base">
                    {book.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-1">
                    {book.author}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="secondary">{book.categoryName}</Badge>
                  <span className="text-muted-foreground">{book.year}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating value={book.rating} readOnly size="sm" />
                  <span className="text-muted-foreground text-xs">
                    {book.ratingCount > 0 ? `${book.rating} (${book.ratingCount})` : "Belum ada rating"}
                  </span>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => void handleRemove(book.id)}
                >
                  <Heart className="text-destructive size-4" />
                  Hapus dari Wishlist
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
