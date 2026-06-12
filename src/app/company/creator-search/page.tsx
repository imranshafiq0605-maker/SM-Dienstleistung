"use client";

import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { ProtectedPage } from "@/components/auth/protected-page";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SelectField, TextField } from "@/components/ui/form-field";
import { db } from "@/lib/firebase";
import { creatorCategories, socialPlatforms } from "@/lib/profile-options";
import type { CreatorProfile, Gender, SocialPlatform } from "@/types/creatorflow";

const genderLabels: Record<Gender, string> = {
  male: "Maennlich",
  female: "Weiblich",
  diverse: "Divers",
  not_specified: "Keine Angabe",
};

const initialFilters = {
  name: "",
  socialName: "",
  category: "",
  platform: "",
  country: "",
  city: "",
  language: "",
  gender: "",
  followerMin: "",
  followerMax: "",
  viewsMin: "",
  viewsMax: "",
  engagementMin: "",
  priceMin: "",
  priceMax: "",
  availability: "",
  verified: "",
  rating: "",
  ugcAvailable: "",
};

function numberValue(value: string) {
  return value === "" ? null : Number(value.replace(",", "."));
}

function includesText(value: string | undefined, search: string) {
  return (value ?? "").toLowerCase().includes(search.trim().toLowerCase());
}

function maxFollowers(profile: CreatorProfile) {
  return Math.max(0, ...(profile.socialAccounts ?? []).map((account) => account.followers ?? 0));
}

function maxViews(profile: CreatorProfile) {
  return Math.max(0, ...(profile.socialAccounts ?? []).map((account) => account.averageViews ?? 0));
}

function maxEngagement(profile: CreatorProfile) {
  return Math.max(0, ...(profile.socialAccounts ?? []).map((account) => account.engagementRate ?? 0));
}

function startPrice(profile: CreatorProfile) {
  const prices = [
    profile.minimumPrice,
    profile.priceStory,
    profile.priceReel,
    profile.priceTikTok,
    profile.priceYouTubeShort,
    profile.priceYouTubeVideo,
    profile.priceUgcVideo,
  ].filter((price) => typeof price === "number" && price > 0);

  return prices.length ? Math.min(...prices) : 0;
}

function creatorName(profile: CreatorProfile) {
  return profile.artistName || `${profile.firstName} ${profile.lastName}`.trim();
}

export default function CompanyCreatorSearchPage() {
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const activeCreatorsQuery = query(
      collection(db, "creatorProfiles"),
      where("status", "==", "active"),
    );

    getDocs(activeCreatorsQuery).then((snapshot) => {
      setCreators(snapshot.docs.map((creatorDoc) => creatorDoc.data() as CreatorProfile));
      setLoading(false);
    });
  }, []);

  const filteredCreators = useMemo(() => {
    const followerMin = numberValue(filters.followerMin);
    const followerMax = numberValue(filters.followerMax);
    const viewsMin = numberValue(filters.viewsMin);
    const viewsMax = numberValue(filters.viewsMax);
    const engagementMin = numberValue(filters.engagementMin);
    const priceMin = numberValue(filters.priceMin);
    const priceMax = numberValue(filters.priceMax);
    const ratingMin = numberValue(filters.rating);

    return creators.filter((creator) => {
      const nameMatch =
        !filters.name ||
        includesText(creatorName(creator), filters.name) ||
        includesText(creator.firstName, filters.name) ||
        includesText(creator.lastName, filters.name);
      const socialNameMatch =
        !filters.socialName ||
        (creator.socialAccounts ?? []).some((account) =>
          includesText(account.username, filters.socialName),
        );
      const categoryMatch =
        !filters.category || (creator.categories ?? []).includes(filters.category);
      const platformMatch =
        !filters.platform ||
        (creator.socialAccounts ?? []).some(
          (account) => account.platform === filters.platform,
        );
      const followerCount = maxFollowers(creator);
      const viewCount = maxViews(creator);
      const engagement = maxEngagement(creator);
      const price = startPrice(creator);
      const verified = Boolean(creator.verified);
      const ugcAvailable = Boolean(creator.ugcAvailable || creator.categories?.includes("UGC") || creator.priceUgcVideo > 0);

      return (
        nameMatch &&
        socialNameMatch &&
        categoryMatch &&
        platformMatch &&
        (!filters.country || includesText(creator.country, filters.country)) &&
        (!filters.city || includesText(creator.city, filters.city)) &&
        (!filters.language || includesText(creator.language, filters.language)) &&
        (!filters.gender || creator.gender === filters.gender) &&
        (followerMin === null || followerCount >= followerMin) &&
        (followerMax === null || followerCount <= followerMax) &&
        (viewsMin === null || viewCount >= viewsMin) &&
        (viewsMax === null || viewCount <= viewsMax) &&
        (engagementMin === null || engagement >= engagementMin) &&
        (priceMin === null || price >= priceMin) &&
        (priceMax === null || price <= priceMax) &&
        (!filters.availability || includesText(creator.availability, filters.availability)) &&
        (!filters.verified || verified === (filters.verified === "yes")) &&
        (ratingMin === null || (creator.rating ?? 0) >= ratingMin) &&
        (!filters.ugcAvailable || ugcAvailable === (filters.ugcAvailable === "yes"))
      );
    });
  }, [creators, filters]);

  function updateFilter(field: keyof typeof filters, value: string) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  return (
    <ProtectedPage role="company">
      <DashboardShell title="Creator suchen">
        <section className="grid gap-5 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Matching
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Creator Filter</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TextField label="Name" value={filters.name} onChange={(e) => updateFilter("name", e.target.value)} />
            <TextField label="Social Media Name" value={filters.socialName} onChange={(e) => updateFilter("socialName", e.target.value)} />
            <SelectField label="Kategorie" value={filters.category} onChange={(e) => updateFilter("category", e.target.value)}>
              <option value="">Alle</option>
              {creatorCategories.map((category) => <option key={category} value={category}>{category}</option>)}
            </SelectField>
            <SelectField label="Plattform" value={filters.platform} onChange={(e) => updateFilter("platform", e.target.value)}>
              <option value="">Alle</option>
              {socialPlatforms.map((platform) => <option key={platform} value={platform}>{platform}</option>)}
            </SelectField>
            <TextField label="Land" value={filters.country} onChange={(e) => updateFilter("country", e.target.value)} />
            <TextField label="Stadt" value={filters.city} onChange={(e) => updateFilter("city", e.target.value)} />
            <TextField label="Sprache" value={filters.language} onChange={(e) => updateFilter("language", e.target.value)} />
            <SelectField label="Geschlecht" value={filters.gender} onChange={(e) => updateFilter("gender", e.target.value)}>
              <option value="">Alle</option>
              {Object.entries(genderLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </SelectField>
            <TextField label="Follower Minimum" inputMode="numeric" value={filters.followerMin} onChange={(e) => updateFilter("followerMin", e.target.value)} />
            <TextField label="Follower Maximum" inputMode="numeric" value={filters.followerMax} onChange={(e) => updateFilter("followerMax", e.target.value)} />
            <TextField label="Views Minimum" inputMode="numeric" value={filters.viewsMin} onChange={(e) => updateFilter("viewsMin", e.target.value)} />
            <TextField label="Views Maximum" inputMode="numeric" value={filters.viewsMax} onChange={(e) => updateFilter("viewsMax", e.target.value)} />
            <TextField label="Engagement Rate Minimum" inputMode="decimal" value={filters.engagementMin} onChange={(e) => updateFilter("engagementMin", e.target.value)} />
            <TextField label="Preis Minimum" inputMode="decimal" value={filters.priceMin} onChange={(e) => updateFilter("priceMin", e.target.value)} />
            <TextField label="Preis Maximum" inputMode="decimal" value={filters.priceMax} onChange={(e) => updateFilter("priceMax", e.target.value)} />
            <TextField label="Verfuegbarkeit" value={filters.availability} onChange={(e) => updateFilter("availability", e.target.value)} />
            <SelectField label="Verifiziert" value={filters.verified} onChange={(e) => updateFilter("verified", e.target.value)}>
              <option value="">Alle</option>
              <option value="yes">Ja</option>
              <option value="no">Nein</option>
            </SelectField>
            <TextField label="Bewertung Minimum" inputMode="decimal" value={filters.rating} onChange={(e) => updateFilter("rating", e.target.value)} />
            <SelectField label="UGC verfuegbar" value={filters.ugcAvailable} onChange={(e) => updateFilter("ugcAvailable", e.target.value)}>
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
              {loading ? "Laedt..." : `${filteredCreators.length} Creator`}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {filteredCreators.map((creator) => {
              const platforms = [...new Set((creator.socialAccounts ?? []).map((account) => account.platform as SocialPlatform))];
              const followers = maxFollowers(creator);
              const views = maxViews(creator);
              const engagement = maxEngagement(creator);
              const price = startPrice(creator);

              return (
                <article className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:grid-cols-[88px_1fr]" key={creator.uid}>
                  <div className="h-24 w-24 overflow-hidden rounded-lg bg-zinc-100">
                    {creator.profileImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt={creatorName(creator)} className="h-full w-full object-cover" src={creator.profileImageUrl} />
                    ) : null}
                  </div>
                  <div className="grid gap-3">
                    <div>
                      <h3 className="text-xl font-semibold">{creatorName(creator) || "Creator"}</h3>
                      <p className="mt-1 text-sm text-zinc-500">
                        {(creator.categories ?? []).join(", ") || "Keine Kategorien"}
                      </p>
                    </div>
                    <dl className="grid gap-2 text-sm sm:grid-cols-2">
                      <div><dt className="text-zinc-500">Plattformen</dt><dd>{platforms.join(", ") || "-"}</dd></div>
                      <div><dt className="text-zinc-500">Follower</dt><dd>{followers.toLocaleString("de-DE")}</dd></div>
                      <div><dt className="text-zinc-500">Views</dt><dd>{views.toLocaleString("de-DE")}</dd></div>
                      <div><dt className="text-zinc-500">Engagement Rate</dt><dd>{engagement}%</dd></div>
                      <div><dt className="text-zinc-500">Ab-Preis</dt><dd>{price ? `${price.toLocaleString("de-DE")} EUR` : "-"}</dd></div>
                      <div><dt className="text-zinc-500">Bewertung</dt><dd>{creator.rating ?? 0}/5</dd></div>
                    </dl>
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold" type="button">Profil ansehen</button>
                      <button className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white" type="button">Angebot senden</button>
                      <button className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold" type="button">Favorisieren</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {!loading && filteredCreators.length === 0 ? (
            <p className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
              Keine passenden Creator gefunden.
            </p>
          ) : null}
        </section>
      </DashboardShell>
    </ProtectedPage>
  );
}
