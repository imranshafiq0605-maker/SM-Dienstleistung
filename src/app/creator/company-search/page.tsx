"use client";

import { collection, getDocs, query, where } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProtectedPage } from "@/components/auth/protected-page";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SelectField, TextField } from "@/components/ui/form-field";
import { db } from "@/lib/firebase";
import type { CompanyProfile } from "@/types/creatorflow";

const initialFilters = {
  activeCampaigns: "",
  budgetMax: "",
  budgetMin: "",
  city: "",
  companyName: "",
  country: "",
  industry: "",
  verified: "",
};

function numberValue(value: string) {
  return value === "" ? null : Number(value.replace(",", "."));
}

function includesText(value: string | undefined, search: string) {
  return (value ?? "").toLowerCase().includes(search.trim().toLowerCase());
}

function budgetLabel(company: CompanyProfile) {
  const min = company.budgetMin ?? 0;
  const max = company.budgetMax ?? 0;

  if (!min && !max) return "Nicht angegeben";
  if (min && max) return `${min.toLocaleString("de-DE")} - ${max.toLocaleString("de-DE")} €`;
  if (min) return `ab ${min.toLocaleString("de-DE")} €`;
  return `bis ${max.toLocaleString("de-DE")} €`;
}

export default function CreatorCompanySearchPage() {
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [favorites, setFavorites] = useState<string[]>(() =>
    typeof window === "undefined"
      ? []
      : JSON.parse(localStorage.getItem("creatorflow:favoriteCompanies") || "[]"),
  );
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(
      query(collection(db, "companyProfiles"), where("status", "==", "active")),
    ).then((snapshot) => {
      setCompanies(snapshot.docs.map((item) => ({ ...(item.data() as CompanyProfile), uid: item.id })));
      setLoading(false);
    });
  }, []);

  const filteredCompanies = useMemo(() => {
    const activeCampaignsMin = numberValue(filters.activeCampaigns);
    const budgetMin = numberValue(filters.budgetMin);
    const budgetMax = numberValue(filters.budgetMax);

    return companies.filter((company) => {
      const companyBudgetMin = company.budgetMin ?? 0;
      const companyBudgetMax = company.budgetMax ?? 0;
      const hasBudgetOverlap =
        (budgetMin === null || companyBudgetMax === 0 || companyBudgetMax >= budgetMin) &&
        (budgetMax === null || companyBudgetMin === 0 || companyBudgetMin <= budgetMax);

      return (
        (!filters.companyName || includesText(company.companyName, filters.companyName)) &&
        (!filters.industry || includesText(company.industry, filters.industry)) &&
        (!filters.country || includesText(company.country, filters.country)) &&
        (!filters.city || includesText(company.city, filters.city)) &&
        (activeCampaignsMin === null || (company.activeCampaigns ?? 0) >= activeCampaignsMin) &&
        hasBudgetOverlap &&
        (!filters.verified || Boolean(company.verified) === (filters.verified === "yes"))
      );
    });
  }, [companies, filters]);

  function updateFilter(field: keyof typeof filters, value: string) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function toggleFavorite(uid: string) {
    setFavorites((current) => {
      const next = current.includes(uid)
        ? current.filter((item) => item !== uid)
        : [...current, uid];
      localStorage.setItem("creatorflow:favoriteCompanies", JSON.stringify(next));
      return next;
    });
  }

  return (
    <ProtectedPage role="creator">
      <DashboardShell title="Unternehmen suchen">
        <section className="overflow-hidden rounded-lg bg-zinc-950 text-white shadow-2xl shadow-zinc-950/20">
          <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                Brand Matching
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                Finde Unternehmen, die zu deinem Content passen.
              </h1>
              <p className="mt-4 text-sm leading-7 text-white/68">
                Suche nach Branche, Standort, Budget, Verifizierung und aktiven
                Kampagnen. Profile, Anfragen und Merkliste sind direkt nutzbar.
              </p>
            </div>
            <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <TextField label="Firmenname" value={filters.companyName} onChange={(e) => updateFilter("companyName", e.target.value)} />
                <TextField label="Branche" value={filters.industry} onChange={(e) => updateFilter("industry", e.target.value)} />
                <TextField label="Land" value={filters.country} onChange={(e) => updateFilter("country", e.target.value)} />
                <TextField label="Stadt" value={filters.city} onChange={(e) => updateFilter("city", e.target.value)} />
                <TextField label="Aktive Kampagnen min." inputMode="numeric" value={filters.activeCampaigns} onChange={(e) => updateFilter("activeCampaigns", e.target.value)} />
                <TextField label="Budget min." inputMode="decimal" value={filters.budgetMin} onChange={(e) => updateFilter("budgetMin", e.target.value)} />
                <TextField label="Budget max." inputMode="decimal" value={filters.budgetMax} onChange={(e) => updateFilter("budgetMax", e.target.value)} />
                <SelectField label="Verifiziert" value={filters.verified} onChange={(e) => updateFilter("verified", e.target.value)}>
                  <option value="">Alle</option>
                  <option value="yes">Ja</option>
                  <option value="no">Nein</option>
                </SelectField>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="premium-kicker">Ergebnisse</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">
                {loading ? "Lädt Unternehmen..." : `${filteredCompanies.length} Unternehmen gefunden`}
              </h2>
            </div>
            <button
              className="premium-button-secondary rounded-lg px-4 py-2.5 text-sm font-semibold"
              onClick={() => setFilters(initialFilters)}
              type="button"
            >
              Filter zurücksetzen
            </button>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            {filteredCompanies.map((company) => {
              const favorite = favorites.includes(company.uid);

              return (
                <article className="premium-card overflow-hidden rounded-lg bg-white" key={company.uid}>
                  <div className="grid gap-0 sm:grid-cols-[190px_1fr]">
                    <div className="relative min-h-56 bg-zinc-900">
                      {company.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt={company.companyName} className="h-full w-full object-cover" src={company.logoUrl} />
                      ) : (
                        <div className="grid h-full place-items-center bg-gradient-to-br from-zinc-900 via-cyan-900 to-zinc-700 text-5xl font-black text-white">
                          {(company.companyName || "U").slice(0, 1)}
                        </div>
                      )}
                      {company.verified ? (
                        <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-black text-zinc-950">
                          Verifiziert
                        </span>
                      ) : null}
                    </div>
                    <div className="grid gap-5 p-5">
                      <div>
                        <h3 className="text-2xl font-black tracking-tight text-zinc-950">{company.companyName || "Unternehmen"}</h3>
                        <p className="mt-1 text-sm font-medium text-zinc-500">
                          {[company.industry, company.city, company.country].filter(Boolean).join(" · ") || "Keine Angaben"}
                        </p>
                      </div>
                      <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                        <div className="rounded-lg bg-zinc-50 p-3"><dt className="text-zinc-500">Kampagnen</dt><dd className="mt-1 font-black">{company.activeCampaigns ?? 0}</dd></div>
                        <div className="rounded-lg bg-zinc-50 p-3 md:col-span-2"><dt className="text-zinc-500">Budget</dt><dd className="mt-1 font-black">{budgetLabel(company)}</dd></div>
                        <div className="rounded-lg bg-zinc-50 p-3"><dt className="text-zinc-500">Status</dt><dd className="mt-1 font-black">{company.verified ? "Verifiziert" : "Offen"}</dd></div>
                      </dl>
                      <p className="line-clamp-2 text-sm leading-6 text-zinc-600">{company.description || "Noch keine Beschreibung hinterlegt."}</p>
                      <div className="flex flex-wrap gap-2">
                        <Link className="premium-button-secondary rounded-lg px-4 py-2.5 text-sm font-black" href={`/creator/companies/${company.uid}`}>
                          Profil ansehen
                        </Link>
                        <Link className="premium-button rounded-lg px-4 py-2.5 text-sm font-black" href={`/creator/offers/new?recipientId=${company.uid}&recipientName=${encodeURIComponent(company.companyName || "Unternehmen")}`}>
                          Anfrage senden
                        </Link>
                        <button className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-black" onClick={() => toggleFavorite(company.uid)} type="button">
                          {favorite ? "Merken entfernen" : "Merken"}
                        </button>
                      </div>
                      <p className="text-xs font-semibold text-zinc-400">
                        Website: {company.website || "Keine Website"}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {!loading && filteredCompanies.length === 0 ? (
            <p className="premium-panel rounded-lg p-6 text-sm text-zinc-500">
              Keine passenden Unternehmen gefunden. Passe die Filter an oder setze sie zurück.
            </p>
          ) : null}
        </section>
      </DashboardShell>
    </ProtectedPage>
  );
}
