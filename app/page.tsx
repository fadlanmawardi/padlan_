"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { useAuth } from "@/components/auth/auth-provider";
import { getRedirectPath } from "@/lib/permissions";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? getRedirectPath(user.role) : "/login");
  }, [user, loading, router]);

  return <LoadingScreen />;
}
