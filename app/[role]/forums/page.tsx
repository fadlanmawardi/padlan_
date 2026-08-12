import type { Metadata } from "next";
import { ForumDiscussion } from "@/components/teaching/forum-discussion";

export const metadata: Metadata = { title: "Forum Diskusi" };

export default function ForumsPage() {
  return <ForumDiscussion />;
}
