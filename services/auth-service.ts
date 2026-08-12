import {
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, hasFirebaseConfig } from "@/lib/firebase";
import { isRole } from "@/lib/permissions";
import type { AppUser, Role } from "@/types";
import { findUserByEmail } from "./user-service";
import { dbPasswords } from "./store";
import { recordLogin } from "./account-service";

export interface AuthResult {
  user: {
    uid: string;
    email: string | null;
    name: string;
  };
  role: Role;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

function mapFirebaseError(code: string): string {
  const messages: Record<string, string> = {
    "auth/invalid-credential": "Email atau kata sandi salah",
    "auth/user-not-found": "Akun tidak ditemukan",
    "auth/wrong-password": "Kata sandi salah",
    "auth/invalid-email": "Format email tidak valid",
    "auth/too-many-requests":
      "Terlalu banyak percobaan. Silakan coba lagi nanti",
  };
  return messages[code] ?? "Gagal masuk. Silakan coba lagi.";
}

async function fetchRoleFromFirestore(uid: string): Promise<Role | null> {
  if (!db) return null;
  try {
    const docRef = doc(db, "users", uid);
    const snap = await getDoc(docRef);
    const data = snap.data() as { role?: unknown } | undefined;
    if (data && isRole(data.role)) return data.role;
  } catch {
    return null;
  }
  return null;
}

/** Ambil role user dari Firestore (collection `users`). */
export async function fetchUserRole(uid: string): Promise<Role | null> {
  return fetchRoleFromFirestore(uid);
}

/**
 * Masuk menggunakan Firebase Authentication.
 * Jika Firebase belum dikonfigurasi (env kosong), gunakan mode demo
 * berdasarkan data dummy sehingga frontend tetap bisa diuji.
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  if (!hasFirebaseConfig() || !auth) {
    return demoSignIn(email, password);
  }
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser: User = credential.user;
    let role = await fetchRoleFromFirestore(firebaseUser.uid);
    if (!role) role = "student";
    return {
      user: {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName ?? email.split("@")[0],
      },
      role,
    };
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : "";
    throw new AuthError(mapFirebaseError(code));
  }
}

async function demoSignIn(
  email: string,
  password: string
): Promise<AuthResult> {
  await new Promise((r) => setTimeout(r, 800));
  const user = await findUserByEmail(email);
  if (!user) {
    await recordLogin("unknown", "failed");
    throw new AuthError(
      "Akun tidak ditemukan. Gunakan akun demo yang tersedia di bawah formulir."
    );
  }
  const stored = dbPasswords.get(user.uid);
  if (stored === undefined || stored !== password) {
    await recordLogin(user.uid, "failed");
    throw new AuthError("Email atau kata sandi salah");
  }
  await recordLogin(user.uid, "success");
  return {
    user: { uid: user.uid, email: user.email, name: user.name },
    role: user.role,
  };
}

export async function logout(): Promise<void> {
  if (auth) {
    try {
      await signOut(auth);
    } catch {
      // abaikan jika tidak ada sesi aktif
    }
  }
}

export async function getCurrentUserProfile(): Promise<AppUser | null> {
  if (!auth?.currentUser) return null;
  const uid = auth.currentUser.uid;
  if (!db) return null;
  const docRef = doc(db, "users", uid);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { ...(snap.data() as AppUser), uid };
}
