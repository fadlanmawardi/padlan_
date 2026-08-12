import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { LanguageProvider } from "@/components/i18n/language-provider";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SchoolHub — Sistem Informasi Sekolah & Perpustakaan Digital",
    template: "%s · SchoolHub",
  },
  description:
    "Sistem Informasi Sekolah & Perpustakaan Digital dengan kontrol akses berbasis peran untuk Super Admin, Admin/Guru, dan Siswa.",
  applicationName: "SchoolHub",
  keywords: [
    "SchoolHub",
    "perpustakaan digital",
    "sistem informasi sekolah",
    "manajemen perpustakaan",
  ],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "SchoolHub",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              {children}
              <PwaRegister />
              <Toaster position="top-right" richColors />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
