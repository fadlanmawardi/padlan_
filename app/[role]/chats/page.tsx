import type { Metadata } from "next";
import { ChatApp } from "@/components/community/chat-app";

export const metadata: Metadata = { title: "Chat" };

export default function ChatsPage() {
  return <ChatApp />;
}