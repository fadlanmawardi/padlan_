# SchoolHub

**Sistem Informasi Sekolah & Perpustakaan Digital**

SchoolHub adalah aplikasi web modern yang menggabungkan **Sistem Informasi Sekolah** dengan **Sistem Manajemen Perpustakaan Digital** dalam satu platform. Dibangun dengan Next.js, TypeScript, Tailwind CSS, dan Firebase (dengan mode demo tanpa konfigurasi).

## Fitur Utama

- **Manajemen Perpustakaan** — koleksi buku, kategori, peminjaman, pengembalian, dan denda.
- **Manajemen Akademik** — tugas, pengumpulan, penilaian, komentar guru, dan absensi siswa.
- **Laporan** — statistik perpustakaan, grafik, dan ekspor CSV.
- **Tiga Peran (RBAC)** — Super Admin, Admin/Guru, dan Siswa dengan kontrol akses berbasis rute.
- **Tema** — mode terang, gelap, dan sistem (next-themes) dengan transisi halus.
- **UI Premium** — desain modern ala SaaS dengan sidebar yang dapat diciutkan, breadcrumb, notifikasi, dan dashboard interaktif.
- **Responsif** — sempurna di desktop, tablet, dan mobile.

## Peran & Akun Demo

| Peran | Email | Kata Sandi |
|---|---|---|
| Super Admin | `superadmin@schoolhub.id` | `demo1234` |
| Admin / Guru | `budi@schoolhub.id` | `demo1234` |
| Siswa | `alya@student.schoolhub.id` | `demo1234` |

Mode demo aktif secara otomatis ketika Firebase belum dikonfigurasi. Semua data tersimpan di memori dan tersinkronisasi antar peran.

## Teknologi

- **Next.js 16** (App Router) — Server & Client Components
- **React 19** + **TypeScript**
- **Tailwind CSS v4** + CSS Variables (tema terang/gelap)
- **next-themes** — Light / Dark / System mode
- **shadcn/ui** + **Radix UI** + **Lucide Icons**
- **Firebase** — Authentication & Firestore (opsional)

## Menjalankan Proyek

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Skrip

| Perintah | Deskripsi |
|---|---|
| `npm run dev` | Menjalankan server pengembangan |
| `npm run build` | Membangun aplikasi untuk produksi |
| `npm run start` | Menjalankan hasil build produksi |
| `npm run lint` | Memeriksa kode dengan ESLint |
| `npm run typecheck` | Memeriksa tipe dengan `tsc --noEmit` |

## Struktur

```
app/          Routes App Router & halaman
components/   Komponen UI, layout, dashboard, dan fitur
lib/          Utilitas, navigasi, izin, dan konfigurasi Firebase
services/     Lapisan data (satu sumber kebenaran antar peran)
types/        Definisi tipe TypeScript
data/         Data dummy untuk mode demo
scripts/      Skrip uji integrasi
```

## Konfigurasi Firebase (Opsional)

Salin `.env.local.example` menjadi `.env.local` lalu isi kredensial Firebase untuk mengaktifkan autentikasi sungguhan. Tanpa konfigurasi ini, aplikasi berjalan dalam mode demo.
