"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useAuth } from "@/components/auth/auth-provider";

const roleLabels = {
  admin: "Admin",
  creator: "Creator",
  company: "Unternehmen",
};

const shortLabels: Record<string, string> = {
  "Anfrage senden": "Anfrage",
  Bewerbungen: "Bewerb.",
  "Creator suchen": "Creator",
  Dashboard: "Home",
  Deals: "Deals",
  "Kampagne erstellen": "Kampagne",
  Kampagnen: "Kampagn.",
  "Media Kit": "Kit",
  Profil: "Profil",
  Socials: "Socials",
  "Unternehmen suchen": "Firmen",
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
  const navItems =
    appUser?.role === "creator"
      ? [
          ["/creator/dashboard", "Dashboard"],
          ["/creator/profile", "Profil"],
          ["/creator/socials", "Socials"],
          ["/creator/media-kit", "Media Kit"],
          ["/creator/company-search", "Unternehmen suchen"],
          ["/creator/campaigns", "Kampagnen"],
          ["/creator/offers/new", "Anfrage senden"],
          ["/creator/deals", "Deals"],
        ]
      : appUser?.role === "company"
        ? [
            ["/company/dashboard", "Dashboard"],
            ["/company/profile", "Profil"],
            ["/company/creator-search", "Creator suchen"],
            ["/company/campaigns/new", "Kampagne erstellen"],
            ["/company/applications", "Bewerbungen"],
            ["/company/offers/new", "Angebot senden"],
            ["/company/deals", "Deals"],
          ]
        : [];

  return (
    <main className="premium-shell pb-28 text-zinc-950 md:pb-0">
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

        {navItems.length ? (
          <nav className="hidden rounded-lg border border-zinc-200 bg-white/55 p-2 shadow-[0_1px_2px_rgb(20_20_17/0.04)] backdrop-blur md:flex md:flex-wrap md:gap-2">
            <span className="rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-black text-white">
              Menü
            </span>
            {navItems.map(([href, label]) => (
              <NavLink href={href} key={href} label={label} />
            ))}
          </nav>
        ) : null}

        <div className="contents">{children}</div>
      </div>

      {navItems.length ? (
        <nav className="liquid-glass fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 gap-1 rounded-lg p-2 md:hidden">
          {navItems.slice(0, 5).map(([href, label]) => (
            <Link
              className="rounded-lg px-2 py-3 text-center text-[11px] font-black text-zinc-800"
              href={href}
              key={href}
            >
              {shortLabels[label] || label}
            </Link>
          ))}
        </nav>
      ) : null}
    </main>
  );
}
