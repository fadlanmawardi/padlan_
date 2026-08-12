import { LibraryBig } from "lucide-react";
import { ErrorScreen } from "@/components/shared/error-screen";

export default function NotFound() {
  return (
    <ErrorScreen
      status={404}
      title="Halaman tidak ditemukan"
      description="Halaman yang kamu cari mungkin sudah dipindahkan atau tidak tersedia."
      icon={LibraryBig}
    />
  );
}
