"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
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
      router.replace(role === "admin" ? "/admin/login" : "/login");
      return;
    }

  }, [appUser, loading, role, router]);

  if (loading || !appUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
        <p className="text-sm font-medium text-zinc-500">Lade...</p>
      </main>
    );
  }

  if (appUser.role !== role) {
    return (
      <main className="premium-shell flex min-h-screen items-center justify-center px-4 py-12">
        <section className="premium-panel w-full max-w-lg rounded-lg p-6 text-center sm:p-8">
          <p className="premium-kicker">Kein Zugriff</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
            Dieser Bereich ist nur fuer {role}.
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Dein aktueller Account hat die Rolle{" "}
            <span className="font-semibold text-zinc-950">{appUser.role}</span>.
            Fuer diesen Bereich muss in Firestore unter users/{appUser.uid} die
            Rolle {role} gespeichert sein.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {role === "admin" ? (
              <Link
                className="premium-button rounded-lg px-4 py-3 text-sm font-semibold"
                href="/admin/login"
              >
                Zum Admin Login
              </Link>
            ) : null}
            <Link
              className="premium-button-secondary rounded-lg px-4 py-3 text-sm font-semibold"
              href="/login"
            >
              Zum Login
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return children;
}
