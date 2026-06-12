"use client";

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
        {appUser ? (
          <StatusCard
            activeText="Dein Unternehmensprofil ist aktiv. Kontakt- und Kampagnenfunktionen koennen in den naechsten MVPs freigeschaltet werden."
            status={appUser.status}
          />
        ) : null}

        <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Unternehmen
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              {profile?.companyName || "Unternehmen"}
            </h2>
          </div>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-zinc-500">Ansprechpartner</dt>
              <dd className="mt-1 text-zinc-900">
                {profile?.contactPerson || "-"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Branche</dt>
              <dd className="mt-1 text-zinc-900">{profile?.industry || "-"}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Website</dt>
              <dd className="mt-1 text-zinc-900">{profile?.website || "-"}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Ort</dt>
              <dd className="mt-1 text-zinc-900">
                {[profile?.city, profile?.country].filter(Boolean).join(", ") ||
                  "-"}
              </dd>
            </div>
          </dl>
        </section>
      </DashboardShell>
    </ProtectedPage>
  );
}
