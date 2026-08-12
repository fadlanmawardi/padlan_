import type { Metadata } from "next";
import { ProfilePage } from "@/components/student/profile-page";

export const metadata: Metadata = { title: "Profil" };

export default function ProfileRoute() {
  return <ProfilePage />;
}
