"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { PillBottomNav, type PillNavItem } from "@/components/layout/pill-bottom-nav";

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

export function DashboardShell({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  const { appUser, signOut } = useAuth();
  const navItems: PillNavItem[] =
    appUser?.role === "creator"
      ? [
          { href: "/creator/dashboard", icon: "menu", label: "Home" },
          { href: "/creator/profile", icon: "user", label: "Profil" },
          { href: "/creator/socials", icon: "network", label: "Socials" },
          { href: "/creator/campaigns", icon: "ticket", label: "Kampagnen" },
          { href: "/creator/deals", icon: "wallet", label: "Deals" },
          { href: "/creator/company-search", icon: "briefcase", label: "Firmen" },
          { href: "/creator/media-kit", icon: "bars", label: "Media Kit" },
        ]
      : appUser?.role === "company"
        ? [
            { href: "/company/dashboard", icon: "menu", label: "Home" },
            { href: "/company/profile", icon: "briefcase", label: "Profil" },
            { href: "/company/creator-search", icon: "user", label: "Creator" },
            { href: "/company/campaigns/new", icon: "ticket", label: "Kampagne" },
            { href: "/company/deals", icon: "wallet", label: "Deals" },
            { href: "/company/applications", icon: "bars", label: "Bewerbungen" },
            { href: "/company/offers/new", icon: "chat", label: "Angebote" },
          ]
        : [];

  return (
    <main className="premium-shell pb-32 text-zinc-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <header className="liquid-glass rounded-lg p-5 sm:p-6">
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
              className="hidden rounded-lg border border-zinc-200 bg-white/75 px-4 py-2.5 text-sm font-semibold shadow-sm backdrop-blur md:inline-flex"
              onClick={signOut}
              type="button"
            >
              Abmelden
            </button>
          </div>
        </header>

        <div className="contents">{children}</div>
      </div>

      {navItems.length ? <PillBottomNav items={navItems} /> : null}
    </main>
  );
}
