"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type PillNavItem = {
  href: string;
  icon: "menu" | "bars" | "network" | "ticket" | "wallet" | "user" | "briefcase" | "chat";
  label: string;
};

function NavIcon({ icon }: { icon: PillNavItem["icon"] }) {
  const common = "h-7 w-7";

  if (icon === "menu") {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24">
        <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2.7" />
      </svg>
    );
  }

  if (icon === "bars") {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24">
        <path d="M5 20V10M12 20V4M19 20v-7" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
      </svg>
    );
  }

  if (icon === "network") {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24">
        <path d="M7 8l5 4 5-4M7 16l5-4 5 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
        <circle cx="5" cy="6" r="2" stroke="currentColor" strokeWidth="2.2" />
        <circle cx="19" cy="6" r="2" stroke="currentColor" strokeWidth="2.2" />
        <circle cx="5" cy="18" r="2" stroke="currentColor" strokeWidth="2.2" />
        <circle cx="19" cy="18" r="2" stroke="currentColor" strokeWidth="2.2" />
      </svg>
    );
  }

  if (icon === "ticket") {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24">
        <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" stroke="currentColor" strokeWidth="2.2" />
        <path d="M12 9v6" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
      </svg>
    );
  }

  if (icon === "wallet") {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24">
        <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z" stroke="currentColor" strokeWidth="2.2" />
        <path d="M16 12h4M7 9h6" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
      </svg>
    );
  }

  if (icon === "briefcase") {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24">
        <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7M5 8h14v10H5V8Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2.2" />
        <path d="M5 12h14" stroke="currentColor" strokeWidth="2.2" />
      </svg>
    );
  }

  if (icon === "chat") {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24">
        <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H11l-4 4v-4.2A2.5 2.5 0 0 1 5 12.3V6.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2.2" />
      </svg>
    );
  }

  return (
    <svg className={common} fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="2.2" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
    </svg>
  );
}

export function PillBottomNav({ items }: { items: PillNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-3 z-50 flex justify-center px-3">
      <div className="max-w-[calc(100vw-24px)] overflow-x-auto rounded-[2rem] border border-white/15 bg-zinc-950/88 p-2 shadow-[0_22px_70px_rgb(0_0_0/0.42)] backdrop-blur-2xl">
        <div className="flex min-w-max items-center gap-2">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                className={`flex h-20 shrink-0 flex-col items-center justify-center rounded-[1.7rem] px-5 text-sm font-semibold transition ${
                  active
                    ? "min-w-32 bg-white/14 text-cyan-200 shadow-[inset_0_1px_0_rgb(255_255_255/0.14)]"
                    : "min-w-24 text-white/88 hover:bg-white/8"
                }`}
                href={item.href}
                key={item.href}
              >
                <NavIcon icon={item.icon} />
                <span className="mt-1.5 whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
