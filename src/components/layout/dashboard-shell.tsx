"use client";

import { ReactNode } from "react";
import { useAuth } from "@/components/auth/auth-provider";

export function DashboardShell({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  const { appUser, signOut } = useAuth();

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
        <header className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              CreatorFlow
            </p>
            <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
            {appUser ? (
              <p className="mt-2 text-sm text-zinc-500">
                {appUser.email} · {appUser.role} · Status: {appUser.status}
              </p>
            ) : null}
          </div>
          <button
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800"
            onClick={signOut}
            type="button"
          >
            Abmelden
          </button>
        </header>
        {children}
      </div>
    </main>
  );
}
