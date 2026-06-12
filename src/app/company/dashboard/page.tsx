"use client";

import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ProtectedPage } from "@/components/auth/protected-page";
import { useAuth } from "@/components/auth/auth-provider";
import { StatusCard } from "@/components/dashboard/status-card";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { db } from "@/lib/firebase";
import type { CompanyProfile } from "@/types/creatorflow";

export default function CompanyDashboardPage() {
  const { appUser } = useAuth();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!appUser) return;

      const snapshot = await getDoc(doc(db, "companyProfiles", appUser.uid));
      setProfile(snapshot.exists() ? (snapshot.data() as CompanyProfile) : null);
    }

    void loadProfile();
  }, [appUser]);

  return (
    <ProtectedPage role="company">
      <DashboardShell title="Unternehmen Dashboard">
        <section className="company-media slide-in-right min-h-[420px] rounded-lg p-5 text-white shadow-2xl shadow-zinc-950/15 sm:p-8">
          <div className="flex h-full max-w-3xl flex-col justify-end">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
              Brand Control Room
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
              {profile?.companyName || "Dein Unternehmen"} findet passende Creator.
            </h1>
            <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-white/82">
              Suche Creator, starte Kampagnen, prüfe Bewerbungen und begleite
              Content bis zur Veröffentlichung.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link className="rounded-lg bg-white px-5 py-3 text-center text-sm font-black text-zinc-950" href="/company/creator-search">
                Creator suchen
              </Link>
              <Link className="liquid-glass rounded-lg px-5 py-3 text-center text-sm font-black text-zinc-950" href="/company/campaigns/new">
                Kampagne erstellen
              </Link>
            </div>
          </div>
        </section>

        {appUser ? (
          <StatusCard
            activeText="Dein Unternehmensprofil ist aktiv. Du kannst Creator kontaktieren und Kampagnen erstellen."
            status={appUser.status}
          />
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["Profil", profile?.description ? "Bereit" : "Ausfüllen", "Beschreibung und Branche"],
            ["Standort", [profile?.city, profile?.country].filter(Boolean).join(", ") || "-", "Region und Markt"],
            ["Budget", profile?.budgetMax ? `${profile.budgetMax} €` : "Offen", "Kampagnenrahmen"],
          ].map(([title, value, text]) => (
            <article className="premium-card bounce-soft rounded-lg p-5" key={title}>
              <p className="text-sm font-semibold text-zinc-500">{title}</p>
              <p className="mt-4 text-3xl font-black text-zinc-950">{value}</p>
              <p className="mt-2 text-sm text-zinc-500">{text}</p>
            </article>
          ))}
        </section>
      </DashboardShell>
    </ProtectedPage>
  );
}
