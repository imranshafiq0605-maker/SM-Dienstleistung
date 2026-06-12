"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ProtectedPage } from "@/components/auth/protected-page";
import { PillBottomNav, type PillNavItem } from "@/components/layout/pill-bottom-nav";

const adminLinks = [
  { href: "/admin/dashboard", icon: "menu", label: "Dashboard", short: "Home" },
  { href: "/admin/creators", icon: "user", label: "Creator Verwaltung", short: "Creator" },
  { href: "/admin/companies", icon: "briefcase", label: "Unternehmen", short: "Unternehmen" },
  { href: "/admin/campaigns", icon: "ticket", label: "Kampagnen", short: "Kampagnen" },
  { href: "/admin/deals", icon: "wallet", label: "Deals", short: "Deals" },
  { href: "/admin/disputes", icon: "chat", label: "Streitfälle", short: "Streitfälle" },
  { href: "/admin/settings", icon: "bars", label: "Settings", short: "Settings" },
] satisfies Array<PillNavItem & { short: string }>;

export function AdminShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <ProtectedPage role="admin">
      <main className="premium-shell min-h-screen pb-24 sm:pb-28">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <header className="sticky top-3 z-20 rounded-lg border border-zinc-200 bg-white/94 px-3 py-3 shadow-sm backdrop-blur-xl">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <Link className="rounded-lg px-2 py-1" href="/admin/dashboard">
                  <p className="text-sm font-bold text-zinc-950">
                    CreatorFlow Admin
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-zinc-500">
                    Control Center
                  </p>
                </Link>

                <Link
                  className="premium-button-secondary w-fit rounded-lg px-4 py-2.5 text-sm font-semibold"
                  href="/"
                >
                  Zur Website
                </Link>
              </div>
            </div>
          </header>

          <section className="mt-6 min-w-0">
            <div className="premium-panel rounded-lg px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="premium-kicker">Admin</p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                    {title}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
                    {subtitle}
                  </p>
                </div>
                <Link
                  className="premium-button w-fit rounded-lg px-4 py-2.5 text-sm font-semibold"
                  href="/admin/dashboard"
                >
                  Admin Dashboard
                </Link>
              </div>
            </div>

            <div className="mt-6 grid gap-6">{children}</div>
          </section>
        </div>
      </main>
      <PillBottomNav items={adminLinks} />
    </ProtectedPage>
  );
}
