"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  BadgeCheck,
  CalendarClock,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  MonitorSmartphone,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/shared/page-header";
import { PageLoader } from "@/components/shared/loading-screen";
import { RoleBadge, UserStatusBadge } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTime, formatDate, getInitials } from "@/lib/format";
import {
  evaluatePassword,
  passwordErrors,
  STRENGTH_STYLES,
} from "@/lib/password";
import { cn } from "@/lib/utils";
import { getUserById, updateUser } from "@/services/user-service";
import {
  changePassword,
  getLoginHistory,
  getSessionTimeoutMinutes,
  isEmailVerified,
  logoutAllDevices,
  sendVerificationEmail,
} from "@/services/account-service";
import type { AppUser, LoginHistoryEntry } from "@/types";

const GENDERS = ["Laki-laki", "Perempuan"];

export function ProfilePage() {
  const { user, signOut, updateSession } = useAuth();
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [className, setClassName] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [saving, setSaving] = useState(false);

  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoZoom, setPhotoZoom] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [logoutDevices, setLogoutDevices] = useState(false);
  const [timeoutMinutes, setTimeoutMinutes] = useState(30);
  const [history, setHistory] = useState<LoginHistoryEntry[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const [current, loginHistory, timeout, emailOk] = await Promise.all([
      getUserById(user.uid),
      getLoginHistory(user.uid),
      getSessionTimeoutMinutes(),
      isEmailVerified(user.uid),
    ]);
    setProfile(current);
    setHistory(loginHistory);
    setTimeoutMinutes(timeout);
    setVerified(emailOk);
    if (current) {
      setName(current.name);
      setPhone(current.phone ?? "");
      setClassName(current.className ?? "");
      setAddress(current.address ?? "");
      setBio(current.bio ?? "");
      setGender(current.gender ?? "");
      setBirthDate(current.birthDate ?? "");
      setPhotoPreview(current.photoUrl ?? null);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!profile) return;
    if (!name.trim()) {
      toast.error("Nama tidak boleh kosong");
      return;
    }
    setSaving(true);
    try {
      await updateUser(profile.uid, {
        name: name.trim(),
        phone: phone || undefined,
        className: className || undefined,
        address: address || undefined,
        bio: bio || undefined,
        gender: gender || undefined,
        birthDate: birthDate || undefined,
        photoUrl: photoPreview || undefined,
      });
      updateSession({ name: name.trim() });
      toast.success("Profil diperbarui");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui profil");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(event: React.FormEvent) {
    event.preventDefault();
    if (!profile) return;
    if (!currentPassword) {
      toast.error("Masukkan kata sandi saat ini");
      return;
    }
    if (passwordErrors(newPassword).length > 0) {
      toast.error("Kata sandi baru tidak memenuhi ketentuan");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi kata sandi tidak cocok");
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword(profile.uid, currentPassword, newPassword);
      toast.success("Kata sandi berhasil diubah");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengubah kata sandi");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleVerifyEmail() {
    if (!profile) return;
    setVerifying(true);
    try {
      await sendVerificationEmail(profile.uid);
      setVerified(true);
      toast.success("Verifikasi email berhasil dikirim");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengirim verifikasi");
    } finally {
      setVerifying(false);
    }
  }

  async function handleLogoutAllDevices() {
    if (!profile) return;
    setLogoutDevices(true);
    try {
      await logoutAllDevices(profile.uid);
      toast.success("Semua perangkat telah keluar (mode demo)");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal logout semua perangkat");
    } finally {
      setLogoutDevices(false);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(String(reader.result));
      setPhotoZoom(1);
      setPhotoOpen(true);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function confirmPhoto() {
    setPhotoOpen(false);
    toast.success("Foto profil diperbarui (dummy crop)");
  }

  async function handleLogout() {
    await signOut();
    toast.success("Berhasil keluar");
  }

  if (!user || !profile) return <PageLoader />;

  const strength = evaluatePassword(newPassword);
  const passwordReq = strength.requirements;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil Saya"
        description="Kelola informasi akun dan keamanan."
        actions={
          <Button variant="outline" onClick={() => void handleLogout()}>
            <LogOut className="size-4" />
            Keluar
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col items-center gap-5 px-5 py-8 sm:flex-row sm:items-center">
          <div className="relative">
            <Avatar className="size-24">
              {photoPreview ? (
                <AvatarImage src={photoPreview} alt={profile.name} />
              ) : null}
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 absolute -right-1 -bottom-1 flex size-8 cursor-pointer items-center justify-center rounded-full shadow-md"
              aria-label="Unggah foto"
            >
              <Camera className="size-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <div className="text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h2 className="text-xl font-semibold">{profile.name}</h2>
              <RoleBadge role={profile.role} />
              <UserStatusBadge status={profile.status} />
              {verified ? (
                <Badge variant="successSoft">
                  <BadgeCheck className="size-3" />
                  Email terverifikasi
                </Badge>
              ) : (
                <Badge variant="warningSoft">Email belum terverifikasi</Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1 text-sm">{profile.email}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              {profile.nis && <Badge variant="secondary">NIS {profile.nis}</Badge>}
              {profile.className && <Badge variant="secondary">{profile.className}</Badge>}
              {profile.gender && <Badge variant="secondary">{profile.gender}</Badge>}
              <span className="text-muted-foreground text-xs">
                Terdaftar sejak {formatDate(profile.createdAt)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="size-4" />
              Informasi Akun
            </CardTitle>
            <CardDescription>Perbarui informasi pribadi Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Nama Lengkap</Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    value={profile.email}
                    readOnly
                    disabled
                    className="pl-9 opacity-70"
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  Email digunakan untuk masuk dan tidak dapat diubah di sini.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profile-phone">Nomor HP</Label>
                  <Input
                    id="profile-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
                {profile.role === "student" && (
                  <div className="space-y-2">
                    <Label htmlFor="profile-class">Kelas</Label>
                    <Input
                      id="profile-class"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      placeholder="XI IPA 1"
                    />
                  </div>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Jenis Kelamin</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis kelamin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tidak diisi</SelectItem>
                      {GENDERS.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-birth">Tanggal Lahir</Label>
                  <Input
                    id="profile-birth"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-address">Alamat</Label>
                <div className="relative">
                  <MapPin className="text-muted-foreground absolute top-3 left-3 size-4" />
                  <Input
                    id="profile-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Alamat lengkap"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-bio">Bio</Label>
                <Textarea
                  id="profile-bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Ceritakan sedikit tentang Anda…"
                />
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="size-4 animate-spin" />}
                  {saving ? "Menyimpan…" : "Simpan Perubahan"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-4" />
                Keamanan & Verifikasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-lg",
                      verified ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                    )}
                  >
                    <BadgeCheck className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Verifikasi Email</p>
                    <p className="text-muted-foreground text-xs">
                      {verified
                        ? "Email Anda sudah terverifikasi."
                        : "Verifikasi email untuk keamanan akun."}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleVerifyEmail()}
                  disabled={verifying || verified}
                >
                  {verifying && <Loader2 className="size-3.5 animate-spin" />}
                  {verified ? "Terverifikasi" : "Kirim Verifikasi Email"}
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                    <MonitorSmartphone className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Sesi Aktif</p>
                    <p className="text-muted-foreground text-xs">
                      Sesi berakhir otomatis setelah {timeoutMinutes} menit tidak aktif.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleLogoutAllDevices()}
                  disabled={logoutDevices}
                >
                  {logoutDevices && <Loader2 className="size-3.5 animate-spin" />}
                  Logout Semua Perangkat
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LockKeyhole className="size-4" />
                Ubah Kata Sandi
              </CardTitle>
              <CardDescription>
                Gunakan minimal 8 karakter dengan huruf besar, kecil, dan angka.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Kata Sandi Saat Ini</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showPasswords ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords((v) => !v)}
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                      aria-label="Tampilkan kata sandi"
                    >
                      {showPasswords ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Kata Sandi Baru</Label>
                  <Input
                    id="new-password"
                    type={showPasswords ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  {newPassword.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex flex-1 gap-1">
                        {[1, 2, 3, 4].map((bar) => (
                          <span
                            key={bar}
                            className={cn(
                              "h-1.5 flex-1 rounded-full transition-colors",
                              bar <= strength.score
                                ? STRENGTH_STYLES[strength.label].bar
                                : "bg-muted"
                            )}
                          />
                        ))}
                      </div>
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          STRENGTH_STYLES[strength.label].text
                        )}
                      >
                        {strength.label}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-[11px]">
                    {[
                      { label: "8 karakter", ok: passwordReq.hasMin },
                      { label: "Huruf besar", ok: passwordReq.hasUpper },
                      { label: "Huruf kecil", ok: passwordReq.hasLower },
                      { label: "Angka", ok: passwordReq.hasNumber },
                    ].map((item) => (
                      <span
                        key={item.label}
                        className={cn(
                          "flex items-center gap-1",
                          item.ok ? "text-success" : "text-muted-foreground"
                        )}
                      >
                        <CheckCircle2 className={cn("size-3", !item.ok && "opacity-40")} />
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Konfirmasi Kata Sandi</Label>
                  <Input
                    id="confirm-password"
                    type={showPasswords ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <Button type="submit" disabled={changingPassword} className="w-full">
                  {changingPassword && <Loader2 className="size-4 animate-spin" />}
                  {changingPassword ? "Menyimpan…" : "Ubah Kata Sandi"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="size-4" />
            Riwayat Login
          </CardTitle>
          <CardDescription>Perangkat dan waktu masuk terakhir (demo).</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-muted-foreground text-sm">Belum ada riwayat login.</p>
          ) : (
            <div className="divide-y">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-wrap items-center gap-3 py-3"
                >
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg",
                      entry.status === "success"
                        ? "bg-success/15 text-success"
                        : "bg-destructive/15 text-destructive"
                    )}
                  >
                    {entry.status === "success" ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <LogOut className="size-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {entry.browser} · {entry.device}
                    </p>
                    <p className="text-muted-foreground flex items-center gap-1 text-xs">
                      <Clock className="size-3" />
                      {formatDateTime(entry.timestamp)}
                    </p>
                  </div>
                  <Badge
                    variant={entry.status === "success" ? "successSoft" : "dangerSoft"}
                  >
                    {entry.status === "success" ? "Berhasil" : "Gagal"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={photoOpen} onOpenChange={setPhotoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="size-4" />
              Atur Foto Profil
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/40 mx-auto flex size-40 items-center justify-center overflow-hidden rounded-full">
              {photoPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreview}
                  alt="Pratinjau foto"
                  className="size-full object-cover transition-transform"
                  style={{ transform: `scale(${photoZoom})` }}
                />
              )}            </div>
            <div className="space-y-2">
              <Label>Crop & Zoom (dummy)</Label>
              <Input
                type="range"
                min={1}
                max={2}
                step={0.05}
                value={photoZoom}
                onChange={(e) => setPhotoZoom(Number(e.target.value))}
              />
              <p className="text-muted-foreground text-xs">
                Geser untuk memperbesar/memperkecil. Mode demo.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPhotoOpen(false)}>
              Batal
            </Button>
            <Button onClick={confirmPhoto}>Simpan Foto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
