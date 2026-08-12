import type { LoginHistoryEntry } from "@/types";
import {
  dbEmailVerified,
  dbLoginHistory,
  dbPasswords,
  dbResetTokens,
  dbSessionTimeoutMinutes,
  delay,
  nextId,
} from "./store";
import { findUserByEmail, getUserById } from "./user-service";
import { logAudit } from "./community-service";
import { logActivity } from "./activity-service";
import { passwordErrors } from "@/lib/password";

/* ===================== Kata Sandi ===================== */

export async function verifyPassword(
  uid: string,
  password: string
): Promise<boolean> {
  await delay(120);
  return dbPasswords.get(uid) === password;
}

export async function changePassword(
  uid: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await delay();
  const stored = dbPasswords.get(uid);
  if (stored === undefined) throw new Error("Akun tidak ditemukan");
  if (stored !== currentPassword) {
    throw new Error("Kata sandi saat ini salah");
  }
  const errors = passwordErrors(newPassword);
  if (errors.length > 0) {
    throw new Error(`Kata sandi baru tidak valid: ${errors.join(", ")}`);
  }
  dbPasswords.set(uid, newPassword);
  const user = await getUserById(uid);
  if (user) {
    await logAudit(user.name, "Mengubah kata sandi", "Pengaturan keamanan");
    await logActivity("system", "mengubah kata sandi", user.name);
  }
}

/* ===================== Lupa & Reset Kata Sandi ===================== */

export async function requestPasswordReset(
  email: string
): Promise<{ token: string; name: string }> {
  await delay(700);
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error("Email tidak ditemukan");
  }
  const token = `rst-${Math.random().toString(36).slice(2, 10)}`;
  dbResetTokens.set(token, user.uid);
  await logAudit(user.name, "Meminta reset kata sandi", "Lupa kata sandi");
  return { token, name: user.name };
}

export async function resetPassword(
  token: string,
  email: string,
  newPassword: string
): Promise<void> {
  await delay();
  const uid = dbResetTokens.get(token);
  const user = await findUserByEmail(email);
  if (!uid || !user || uid !== user.uid) {
    throw new Error("Token reset tidak valid atau sudah kedaluwarsa");
  }
  const errors = passwordErrors(newPassword);
  if (errors.length > 0) {
    throw new Error(`Kata sandi tidak valid: ${errors.join(", ")}`);
  }
  dbPasswords.set(uid, newPassword);
  dbResetTokens.delete(token);
  await logAudit(user.name, "Mengatur ulang kata sandi", "Reset kata sandi");
  await logActivity("system", "mengatur ulang kata sandi", user.name);
}

/* ===================== Riwayat Login ===================== */

function detectBrowser(ua: string): string {
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("Chrome/")) return "Chrome";
  if (ua.includes("Safari/")) return "Safari";
  return "Browser lain";
}

function detectDevice(ua: string): string {
  if (/Android/i.test(ua)) return "Android · Mobile";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS · Mobile";
  if (/Mac OS X/.test(ua)) return "macOS · Desktop";
  if (/Windows/.test(ua)) return "Windows · Desktop";
  return "Perangkat lain";
}

export function getCurrentLoginContext(): {
  browser: string;
  device: string;
} {
  if (typeof navigator === "undefined") {
    return { browser: "Browser lain", device: "Perangkat lain" };
  }
  const ua = navigator.userAgent;
  return { browser: detectBrowser(ua), device: detectDevice(ua) };
}

export async function recordLogin(
  uid: string,
  status: "success" | "failed" = "success"
): Promise<LoginHistoryEntry> {
  const { browser, device } = getCurrentLoginContext();
  const entry: LoginHistoryEntry = {
    id: nextId("lh-", dbLoginHistory.map((e) => e.id)),
    userId: uid,
    timestamp: new Date().toISOString(),
    browser,
    device,
    status,
  };
  dbLoginHistory.unshift(entry);
  return { ...entry };
}

export async function getLoginHistory(
  userId: string,
  limit = 10
): Promise<LoginHistoryEntry[]> {
  await delay();
  return dbLoginHistory
    .filter((e) => e.userId === userId)
    .slice(0, limit)
    .map((e) => ({ ...e }));
}

/* ===================== Verifikasi Email ===================== */

export async function isEmailVerified(uid: string): Promise<boolean> {
  await delay(100);
  return dbEmailVerified.has(uid);
}

export async function sendVerificationEmail(uid: string): Promise<void> {
  await delay(700);
  const user = await getUserById(uid);
  if (!user) throw new Error("Akun tidak ditemukan");
  dbEmailVerified.add(uid);
  await logAudit(user.name, "Memverifikasi email", user.email);
  await logActivity("system", "memverifikasi email", user.name);
}

/* ===================== Keamanan Sesi ===================== */

export async function getSessionTimeoutMinutes(): Promise<number> {
  await delay(100);
  return dbSessionTimeoutMinutes;
}

export async function logoutAllDevices(uid: string): Promise<void> {
  await delay(600);
  const user = await getUserById(uid);
  if (!user) throw new Error("Akun tidak ditemukan");
  dbPasswords.set(uid, dbPasswords.get(uid) ?? "demo1234");
  await logAudit(user.name, "Logout semua perangkat", "Keamanan akun");
  await logActivity("system", "logout dari semua perangkat", user.name);
}
