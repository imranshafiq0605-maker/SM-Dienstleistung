"use client";

import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ProtectedPage } from "@/components/auth/protected-page";
import { useAuth } from "@/components/auth/auth-provider";
import { StatusCard } from "@/components/dashboard/status-card";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { db } from "@/lib/firebase";
import type { CreatorProfile } from "@/types/creatorflow";

export default function CreatorDashboardPage() {
  const { appUser } = useAuth();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!appUser) return;

      const snapshot = await getDoc(doc(db, "creatorProfiles", appUser.uid));
      setProfile(snapshot.exists() ? (snapshot.data() as CreatorProfile) : null);
    }

    void loadProfile();
  }, [appUser]);

  const creatorName = profile?.artistName || profile?.firstName || "Creator";

  return (
    <ProtectedPage role="creator">
      <DashboardShell title="Creator Dashboard">
        <section className="creator-media slide-in-left min-h-[420px] rounded-lg p-5 text-white shadow-2xl shadow-zinc-950/15 sm:p-8">
          <div className="flex h-full max-w-3xl flex-col justify-end">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
              Willkommen zurück
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
              {creatorName}, dein Creator-Workspace ist bereit.
            </h1>
            <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-white/82">
              Pflege dein Profil, suche Unternehmen, bewirb dich auf Kampagnen
              und steuere deine Kooperationen von Briefing bis Freigabe.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link className="rounded-lg bg-white px-5 py-3 text-center text-sm font-black text-zinc-950" href="/creator/profile">
                Profil bearbeiten
              </Link>
              <Link className="liquid-glass rounded-lg px-5 py-3 text-center text-sm font-black text-zinc-950" href="/creator/campaigns">
                Kampagnen entdecken
              </Link>
            </div>
          </div>
        </section>

        {appUser ? (
          <StatusCard
            activeText="Dein Creator-Profil ist aktiv und kann von Unternehmen gefunden werden."
            status={appUser.status}
          />
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["Profilstärke", profile?.bio ? "Gut" : "Ausbauen", "Bio, Preise und Kategorien"],
            ["Social Accounts", profile?.socialAccounts?.length || 0, "Plattformen verbunden"],
            ["Media Kit", profile?.mediaKit?.length || 0, "Uploads verfügbar"],
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
