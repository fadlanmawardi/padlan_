import type { Metadata } from "next";
import { WishlistView } from "@/components/student-hub/wishlist-view";

export const metadata: Metadata = { title: "Wishlist Buku" };

export default function WishlistPage() {
  return <WishlistView />;
}
