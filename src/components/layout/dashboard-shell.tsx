"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useAuth } from "@/components/auth/auth-provider";

const roleLabels = {
  admin: "Admin",
  creator: "Creator",
  company: "Unternehmen",
};

const statusStyles = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  rejected: "border-red-200 bg-red-50 text-red-800",
};

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="rounded-lg border border-zinc-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-[0_1px_2px_rgb(20_20_17/0.04)] hover:border-zinc-300 hover:bg-white hover:text-zinc-950"
      href={href}
    >
      {label}
    </Link>
  );
}

export function DashboardShell({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  const { appUser, signOut } = useAuth();

  return (
    <main className="premium-shell text-zinc-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <header className="premium-panel rounded-lg p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link className="inline-flex items-center gap-3" href="/">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-zinc-950 text-sm font-bold text-white shadow-lg shadow-zinc-950/15">
                  CF
                </span>
                <span>
                  <span className="block text-sm font-semibold text-zinc-500">
                    CreatorFlow
                  </span>
                  <span className="block text-xl font-semibold text-zinc-950">
                    {title}
                  </span>
                </span>
              </Link>
              {appUser ? (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600">
                    {appUser.email}
                  </span>
                  <span className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600">
                    {roleLabels[appUser.role]}
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${statusStyles[appUser.status]}`}
                  >
                    {appUser.status}
                  </span>
                </div>
              ) : null}
            </div>
            <button
              className="premium-button-secondary rounded-lg px-4 py-2.5 text-sm font-semibold"
              onClick={signOut}
              type="button"
            >
              Abmelden
            </button>
          </div>
        </header>

        {appUser?.role === "creator" ? (
          <nav className="flex flex-wrap gap-2 rounded-lg border border-zinc-200 bg-white/55 p-2 shadow-[0_1px_2px_rgb(20_20_17/0.04)] backdrop-blur">
            <NavLink href="/creator/dashboard" label="Dashboard" />
            <NavLink href="/creator/profile" label="Profil" />
            <NavLink href="/creator/socials" label="Socials" />
            <NavLink href="/creator/media-kit" label="Media Kit" />
            <NavLink href="/creator/company-search" label="Unternehmen suchen" />
            <NavLink href="/creator/campaigns" label="Kampagnen" />
            <NavLink href="/creator/offers/new" label="Anfrage senden" />
            <NavLink href="/creator/deals" label="Deals" />
          </nav>
        ) : null}

        {appUser?.role === "company" ? (
          <nav className="flex flex-wrap gap-2 rounded-lg border border-zinc-200 bg-white/55 p-2 shadow-[0_1px_2px_rgb(20_20_17/0.04)] backdrop-blur">
            <NavLink href="/company/dashboard" label="Dashboard" />
            <NavLink href="/company/profile" label="Profil" />
            <NavLink href="/company/creator-search" label="Creator suchen" />
            <NavLink href="/company/campaigns/new" label="Kampagne erstellen" />
            <NavLink href="/company/applications" label="Bewerbungen" />
            <NavLink href="/company/offers/new" label="Angebot senden" />
            <NavLink href="/company/deals" label="Deals" />
          </nav>
        ) : null}

        <div className="contents">{children}</div>
      </div>
    </main>
  );
}
