"use client";

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

  return (
    <ProtectedPage role="creator">
      <DashboardShell title="Creator Dashboard">
        {appUser ? (
          <StatusCard
            activeText="Dein Creator-Profil ist aktiv und kann in spaeteren MVPs fuer Unternehmen sichtbar gemacht werden."
            status={appUser.status}
          />
        ) : null}

        <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Profil
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              {profile?.artistName || profile?.firstName || "Creator"}
            </h2>
          </div>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-zinc-500">Name</dt>
              <dd className="mt-1 text-zinc-900">
                {profile ? `${profile.firstName} ${profile.lastName}` : "-"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Ort</dt>
              <dd className="mt-1 text-zinc-900">
                {[profile?.city, profile?.country].filter(Boolean).join(", ") ||
                  "-"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-medium text-zinc-500">Kategorien</dt>
              <dd className="mt-1 text-zinc-900">
                {profile?.categories.length ? profile.categories.join(", ") : "-"}
              </dd>
            </div>
          </dl>
        </section>
      </DashboardShell>
    </ProtectedPage>
  );
}
