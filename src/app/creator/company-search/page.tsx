"use client";

import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { ProtectedPage } from "@/components/auth/protected-page";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SelectField, TextField } from "@/components/ui/form-field";
import { db } from "@/lib/firebase";
import type { CompanyProfile } from "@/types/creatorflow";

const initialFilters = {
  companyName: "",
  industry: "",
  country: "",
  city: "",
  activeCampaigns: "",
  budgetMin: "",
  budgetMax: "",
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

  if (!min && !max) return "-";
  if (min && max) return `${min.toLocaleString("de-DE")} - ${max.toLocaleString("de-DE")} EUR`;
  if (min) return `ab ${min.toLocaleString("de-DE")} EUR`;
  return `bis ${max.toLocaleString("de-DE")} EUR`;
}

export default function CreatorCompanySearchPage() {
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const activeCompaniesQuery = query(
      collection(db, "companyProfiles"),
      where("status", "==", "active"),
    );

    getDocs(activeCompaniesQuery).then((snapshot) => {
      setCompanies(snapshot.docs.map((companyDoc) => companyDoc.data() as CompanyProfile));
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

  return (
    <ProtectedPage role="creator">
      <DashboardShell title="Unternehmen suchen">
        <section className="grid gap-5 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Matching
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Unternehmen Filter
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TextField label="Firmenname" value={filters.companyName} onChange={(e) => updateFilter("companyName", e.target.value)} />
            <TextField label="Branche" value={filters.industry} onChange={(e) => updateFilter("industry", e.target.value)} />
            <TextField label="Land" value={filters.country} onChange={(e) => updateFilter("country", e.target.value)} />
            <TextField label="Stadt" value={filters.city} onChange={(e) => updateFilter("city", e.target.value)} />
            <TextField label="Aktive Kampagnen Minimum" inputMode="numeric" value={filters.activeCampaigns} onChange={(e) => updateFilter("activeCampaigns", e.target.value)} />
            <TextField label="Budget Minimum" inputMode="decimal" value={filters.budgetMin} onChange={(e) => updateFilter("budgetMin", e.target.value)} />
            <TextField label="Budget Maximum" inputMode="decimal" value={filters.budgetMax} onChange={(e) => updateFilter("budgetMax", e.target.value)} />
            <SelectField label="Verifiziert" value={filters.verified} onChange={(e) => updateFilter("verified", e.target.value)}>
              <option value="">Alle</option>
              <option value="yes">Ja</option>
              <option value="no">Nein</option>
            </SelectField>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Ergebnisse</h2>
            <p className="text-sm text-zinc-500">
              {loading ? "Laedt..." : `${filteredCompanies.length} Unternehmen`}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {filteredCompanies.map((company) => (
              <article className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:grid-cols-[88px_1fr]" key={company.uid}>
                <div className="h-24 w-24 overflow-hidden rounded-lg bg-zinc-100">
                  {company.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={company.companyName} className="h-full w-full object-cover" src={company.logoUrl} />
                  ) : null}
                </div>
                <div className="grid gap-3">
                  <div>
                    <h3 className="text-xl font-semibold">{company.companyName || "Unternehmen"}</h3>
                    <p className="mt-1 text-sm text-zinc-500">
                      {[company.industry, company.city, company.country].filter(Boolean).join(" · ") || "Keine Angaben"}
                    </p>
                  </div>
                  <dl className="grid gap-2 text-sm sm:grid-cols-2">
                    <div><dt className="text-zinc-500">Aktive Kampagnen</dt><dd>{company.activeCampaigns ?? 0}</dd></div>
                    <div><dt className="text-zinc-500">Budgetbereich</dt><dd>{budgetLabel(company)}</dd></div>
                    <div><dt className="text-zinc-500">Verifiziert</dt><dd>{company.verified ? "Ja" : "Nein"}</dd></div>
                    <div><dt className="text-zinc-500">Website</dt><dd>{company.website || "-"}</dd></div>
                  </dl>
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold" type="button">Profil ansehen</button>
                    <button className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white" type="button">Anfrage senden</button>
                    <button className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold" type="button">Merken</button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {!loading && filteredCompanies.length === 0 ? (
            <p className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
              Keine passenden Unternehmen gefunden.
            </p>
          ) : null}
        </section>
      </DashboardShell>
    </ProtectedPage>
  );
}
