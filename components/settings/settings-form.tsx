"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2, Clock3, Loader2, RotateCcw, Save } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { PageLoader } from "@/components/shared/loading-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  getSettings,
  resetSettings,
  updateSettings,
} from "@/services/settings-service";
import type { Settings } from "@/types";

export function SettingsForm() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    void getSettings().then(setSettings);
  }, []);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!settings) return;
    if (settings.loanDurationDays < 1 || settings.maxLoansPerStudent < 1) {
      toast.error("Durasi peminjaman dan batas pinjam minimal 1");
      return;
    }
    if (settings.finePerDay < 0) {
      toast.error("Denda per hari tidak boleh negatif");
      return;
    }
    setSaving(true);
    try {
      await updateSettings(settings);
      toast.success("Pengaturan sistem diperbarui");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan pengaturan"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setResetting(true);
    try {
      const defaults = await resetSettings();
      setSettings(defaults);
      toast.success("Pengaturan dikembalikan ke bawaan");
    } catch {
      toast.error("Gagal mereset pengaturan");
    } finally {
      setResetting(false);
    }
  }

  if (!settings) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Sistem"
        description="Kelola pengaturan umum aplikasi perpustakaan."
        actions={
          <Button variant="outline" onClick={handleReset} disabled={resetting}>
            {resetting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RotateCcw className="size-4" />
            )}
            Reset ke Bawaan
          </Button>
        }
      />

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-4" />
              Informasi Perpustakaan
            </CardTitle>
            <CardDescription>
              Nama dan alamat perpustakaan yang ditampilkan kepada pengguna.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lib-name">Nama Perpustakaan</Label>
              <Input
                id="lib-name"
                value={settings.libraryName}
                onChange={(e) =>
                  setSettings({ ...settings, libraryName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lib-address">Alamat</Label>
              <Textarea
                id="lib-address"
                value={settings.libraryAddress}
                onChange={(e) =>
                  setSettings({ ...settings, libraryAddress: e.target.value })
                }
                rows={2}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="open-hour">Jam Buka</Label>
                <Input
                  id="open-hour"
                  type="time"
                  value={settings.openHour}
                  onChange={(e) =>
                    setSettings({ ...settings, openHour: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="close-hour">Jam Tutup</Label>
                <Input
                  id="close-hour"
                  type="time"
                  value={settings.closeHour}
                  onChange={(e) =>
                    setSettings({ ...settings, closeHour: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock3 className="size-4" />
              Aturan Peminjaman
            </CardTitle>
            <CardDescription>
              Pengaturan yang memengaruhi proses peminjaman dan denda.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="duration">Durasi Pinjam (hari)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  value={settings.loanDurationDays}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      loanDurationDays: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fine">Denda per Hari (Rp)</Label>
                <Input
                  id="fine"
                  type="number"
                  min={0}
                  value={settings.finePerDay}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      finePerDay: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-loans">Batas Pinjam per Siswa</Label>
                <Input
                  id="max-loans"
                  type="number"
                  min={1}
                  value={settings.maxLoansPerStudent}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maxLoansPerStudent: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex items-center justify-end gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Simpan Pengaturan
          </Button>
        </div>
      </form>
    </div>
  );
}
