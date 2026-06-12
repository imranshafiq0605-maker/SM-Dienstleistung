"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import type { UserRole } from "@/types/creatorflow";

export function ProtectedPage({
  children,
  role,
}: {
  children: ReactNode;
  role: UserRole;
}) {
  const router = useRouter();
  const { appUser, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!appUser) {
      router.replace("/login");
      return;
    }

    if (appUser.role !== role) {
      router.replace("/");
    }
  }, [appUser, loading, role, router]);

  if (loading || !appUser || appUser.role !== role) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
        <p className="text-sm font-medium text-zinc-500">Lade...</p>
      </main>
    );
  }

  return children;
}
