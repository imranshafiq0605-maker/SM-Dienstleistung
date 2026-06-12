"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ProtectedPage } from "@/components/auth/protected-page";

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/creators", label: "Creator" },
  { href: "/admin/companies", label: "Unternehmen" },
  { href: "/admin/campaigns", label: "Kampagnen" },
  { href: "/admin/deals", label: "Deals" },
  { href: "/admin/disputes", label: "Streitfaelle" },
  { href: "/admin/settings", label: "Settings" },
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
        <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:px-8">
          <aside className="sticky top-5 hidden h-[calc(100vh-2.5rem)] w-64 shrink-0 rounded-lg border border-zinc-200 bg-white/82 p-4 shadow-sm backdrop-blur-xl lg:block">
            <Link className="block rounded-lg px-3 py-3" href="/admin/dashboard">
              <p className="text-sm font-bold text-zinc-950">CreatorFlow</p>
              <p className="mt-1 text-xs font-medium text-zinc-500">
                Admin Control Center
              </p>
            </Link>

            <nav className="mt-6 grid gap-1">
              {adminLinks.map((link) => {
                const active = pathname === link.href;

                return (
                  <Link
                    className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${
                      active
                        ? "bg-zinc-950 text-white shadow-sm"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                    }`}
                    href={link.href}
                    key={link.href}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <section className="min-w-0 flex-1">
            <header className="premium-panel rounded-lg px-5 py-5 sm:px-6">
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
                  className="premium-button-secondary w-fit rounded-lg px-4 py-2.5 text-sm font-semibold"
                  href="/"
                >
                  Zur Website
                </Link>
              </div>

              <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
                {adminLinks.map((link) => {
                  const active = pathname === link.href;

                  return (
                    <Link
                      className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${
                        active
                          ? "bg-zinc-950 text-white"
                          : "border border-zinc-200 bg-white text-zinc-600"
                      }`}
                      href={link.href}
                      key={link.href}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </header>

            <div className="mt-6 grid gap-6">{children}</div>
          </section>
        </div>
      </main>
    </ProtectedPage>
  );
}
