"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ProtectedPage } from "@/components/auth/protected-page";

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard", short: "Home" },
  { href: "/admin/creators", label: "Creator verwalten", short: "Creator" },
  { href: "/admin/companies", label: "Unternehmen verwalten", short: "Companies" },
  { href: "/admin/campaigns", label: "Kampagnen prüfen", short: "Campaigns" },
  { href: "/admin/deals", label: "Deals & Angebote", short: "Deals" },
  { href: "/admin/disputes", label: "Streitfaelle", short: "Disputes" },
  { href: "/admin/settings", label: "Settings", short: "Settings" },
];

export function AdminShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <ProtectedPage role="admin">
      <main className="premium-shell min-h-screen">
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

              <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-2">
                <p className="px-2 pb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
                  Admin Menü
                </p>
                <nav className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                  {adminLinks.map((link) => {
                    const active = pathname === link.href;

                    return (
                      <Link
                        className={`rounded-lg px-3 py-3 text-center text-sm font-semibold ${
                          active
                            ? "bg-zinc-950 text-white shadow-sm"
                            : "border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-white hover:text-zinc-950"
                        }`}
                        href={link.href}
                        key={link.href}
                      >
                        <span className="hidden 2xl:inline">{link.label}</span>
                        <span className="2xl:hidden">{link.short}</span>
                      </Link>
                    );
                  })}
                </nav>
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
    </ProtectedPage>
  );
}
