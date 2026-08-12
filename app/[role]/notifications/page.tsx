import type { Metadata } from "next";
import { NotificationCenter } from "@/components/community/notification-center";

export const metadata: Metadata = { title: "Notifikasi" };

export default function NotificationsPage() {
  return <NotificationCenter />;
}
