"use client";

import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProtectedPage } from "@/components/auth/protected-page";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { db } from "@/lib/firebase";
import type { CompanyProfile } from "@/types/creatorflow";

function budgetLabel(company: CompanyProfile) {
  const min = company.budgetMin ?? 0;
  const max = company.budgetMax ?? 0;

  if (!min && !max) return "Nicht angegeben";
  if (min && max) return `${min.toLocaleString("de-DE")} - ${max.toLocaleString("de-DE")} €`;
  if (min) return `ab ${min.toLocaleString("de-DE")} €`;
  return `bis ${max.toLocaleString("de-DE")} €`;
}

export default function CreatorCompanyProfilePage() {
  const params = useParams<{ uid: string }>();
  const [company, setCompany] = useState<CompanyProfile | null>(null);

  useEffect(() => {
    getDoc(doc(db, "companyProfiles", params.uid)).then((snapshot) => {
      setCompany(snapshot.exists() ? ({ ...(snapshot.data() as CompanyProfile), uid: params.uid }) : null);
    });
  }, [params.uid]);

  return (
    <ProtectedPage role="creator">
      <DashboardShell title="Unternehmensprofil">
        {!company ? (
          <section className="premium-panel rounded-lg p-6 text-sm text-zinc-500">
            Unternehmen wird geladen...
          </section>
        ) : (
          <section className="premium-panel overflow-hidden rounded-lg">
            <div className="grid lg:grid-cols-[360px_1fr]">
              <div className="min-h-[420px] bg-zinc-950">
                {company.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={company.companyName} className="h-full w-full object-cover" src={company.logoUrl} />
                ) : (
                  <div className="grid h-full place-items-center text-7xl font-black text-white">
                    {(company.companyName || "U").slice(0, 1)}
                  </div>
                )}
              </div>
              <div className="grid gap-6 p-6 sm:p-8">
                <div>
                  <p className="premium-kicker">Unternehmen</p>
                  <h1 className="mt-3 text-4xl font-black tracking-tight text-zinc-950">
                    {company.companyName}
                  </h1>
                  <p className="mt-2 text-sm font-medium text-zinc-500">
                    {[company.industry, company.city, company.country].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <p className="text-base leading-8 text-zinc-600">
                  {company.description || "Keine Beschreibung hinterlegt."}
                </p>
                <dl className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-white p-4"><dt className="text-sm text-zinc-500">Budget</dt><dd className="mt-1 text-xl font-black">{budgetLabel(company)}</dd></div>
                  <div className="rounded-lg bg-white p-4"><dt className="text-sm text-zinc-500">Kampagnen</dt><dd className="mt-1 text-2xl font-black">{company.activeCampaigns ?? 0}</dd></div>
                  <div className="rounded-lg bg-white p-4"><dt className="text-sm text-zinc-500">Verifiziert</dt><dd className="mt-1 text-2xl font-black">{company.verified ? "Ja" : "Nein"}</dd></div>
                </dl>
                <div className="flex flex-wrap gap-2">
                  <Link className="premium-button rounded-lg px-5 py-3 text-sm font-black" href={`/creator/offers/new?recipientId=${company.uid}&recipientName=${encodeURIComponent(company.companyName || "Unternehmen")}`}>
                    Anfrage senden
                  </Link>
                  <Link className="premium-button-secondary rounded-lg px-5 py-3 text-sm font-black" href="/creator/company-search">
                    Zurück zur Suche
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </DashboardShell>
    </ProtectedPage>
  );
}
