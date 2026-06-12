"use client";

import { collection, getDocs, query, where } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProtectedPage } from "@/components/auth/protected-page";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SelectField, TextField } from "@/components/ui/form-field";
import { db } from "@/lib/firebase";
import { creatorCategories, socialPlatforms } from "@/lib/profile-options";
import type { CreatorProfile, Gender, SocialPlatform } from "@/types/creatorflow";

const genderLabels: Record<Gender, string> = {
  diverse: "Divers",
  female: "Weiblich",
  male: "Männlich",
  not_specified: "Keine Angabe",
};

const initialFilters = {
  availability: "",
  category: "",
  city: "",
  country: "",
  engagementMin: "",
  followerMax: "",
  followerMin: "",
  gender: "",
  language: "",
  name: "",
  platform: "",
  priceMax: "",
  priceMin: "",
  rating: "",
  socialName: "",
  ugcAvailable: "",
  verified: "",
  viewsMax: "",
  viewsMin: "",
};

function numberValue(value: string) {
  return value === "" ? null : Number(value.replace(",", "."));
}

function includesText(value: string | undefined, search: string) {
  return (value ?? "").toLowerCase().includes(search.trim().toLowerCase());
}

function creatorName(profile: CreatorProfile) {
  return profile.artistName || `${profile.firstName} ${profile.lastName}`.trim();
}

function maxFollowers(profile: CreatorProfile) {
  return Math.max(
    0,
    ...(profile.socialAccounts ?? []).map((account) => account.followers ?? 0),
  );
}

function maxViews(profile: CreatorProfile) {
  return Math.max(
    0,
    ...(profile.socialAccounts ?? []).map((account) => account.averageViews ?? 0),
  );
}

function maxEngagement(profile: CreatorProfile) {
  return Math.max(
    0,
    ...(profile.socialAccounts ?? []).map((account) => account.engagementRate ?? 0),
  );
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

export default function CompanyCreatorSearchPage() {
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [favorites, setFavorites] = useState<string[]>(() =>
    typeof window === "undefined"
      ? []
      : JSON.parse(localStorage.getItem("creatorflow:favoriteCreators") || "[]"),
  );
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(
      query(collection(db, "creatorProfiles"), where("status", "==", "active")),
    ).then((snapshot) => {
      setCreators(snapshot.docs.map((item) => ({ ...(item.data() as CreatorProfile), uid: item.id })));
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
      const followerCount = maxFollowers(creator);
      const viewCount = maxViews(creator);
      const engagement = maxEngagement(creator);
      const price = startPrice(creator);
      const ugcAvailable =
        Boolean(creator.ugcAvailable) ||
        creator.categories?.includes("UGC") ||
        creator.priceUgcVideo > 0;

      return (
        (!filters.name ||
          includesText(creatorName(creator), filters.name) ||
          includesText(creator.firstName, filters.name) ||
          includesText(creator.lastName, filters.name)) &&
        (!filters.socialName ||
          (creator.socialAccounts ?? []).some((account) =>
            includesText(account.username, filters.socialName),
          )) &&
        (!filters.category || (creator.categories ?? []).includes(filters.category)) &&
        (!filters.platform ||
          (creator.socialAccounts ?? []).some(
            (account) => account.platform === filters.platform,
          )) &&
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
        (!filters.verified || Boolean(creator.verified) === (filters.verified === "yes")) &&
        (ratingMin === null || (creator.rating ?? 0) >= ratingMin) &&
        (!filters.ugcAvailable || ugcAvailable === (filters.ugcAvailable === "yes"))
      );
    });
  }, [creators, filters]);

  function updateFilter(field: keyof typeof filters, value: string) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function toggleFavorite(uid: string) {
    setFavorites((current) => {
      const next = current.includes(uid)
        ? current.filter((item) => item !== uid)
        : [...current, uid];
      localStorage.setItem("creatorflow:favoriteCreators", JSON.stringify(next));
      return next;
    });
  }

  return (
    <ProtectedPage role="company">
      <DashboardShell title="Creator suchen">
        <section className="overflow-hidden rounded-lg bg-zinc-950 text-white shadow-2xl shadow-zinc-950/20">
          <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                Creator Matching
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                Finde Creator, die wirklich zu deiner Kampagne passen.
              </h1>
              <p className="mt-4 text-sm leading-7 text-white/68">
                Filtere nach Reichweite, Plattform, Kategorie, Standort, Sprache,
                Preis und Qualität. Aktionen sind direkt an den Cards verfügbar.
              </p>
            </div>
            <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <TextField label="Name" value={filters.name} onChange={(e) => updateFilter("name", e.target.value)} />
                <TextField label="Social Name" value={filters.socialName} onChange={(e) => updateFilter("socialName", e.target.value)} />
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
                <SelectField label="Verifiziert" value={filters.verified} onChange={(e) => updateFilter("verified", e.target.value)}>
                  <option value="">Alle</option>
                  <option value="yes">Ja</option>
                  <option value="no">Nein</option>
                </SelectField>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <TextField label="Follower min." inputMode="numeric" value={filters.followerMin} onChange={(e) => updateFilter("followerMin", e.target.value)} />
                <TextField label="Follower max." inputMode="numeric" value={filters.followerMax} onChange={(e) => updateFilter("followerMax", e.target.value)} />
                <TextField label="Views min." inputMode="numeric" value={filters.viewsMin} onChange={(e) => updateFilter("viewsMin", e.target.value)} />
                <TextField label="Engagement min." inputMode="decimal" value={filters.engagementMin} onChange={(e) => updateFilter("engagementMin", e.target.value)} />
                <TextField label="Preis max." inputMode="decimal" value={filters.priceMax} onChange={(e) => updateFilter("priceMax", e.target.value)} />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="premium-kicker">Ergebnisse</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">
                {loading ? "Lädt Creator..." : `${filteredCreators.length} Creator gefunden`}
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
            {filteredCreators.map((creator) => {
              const name = creatorName(creator) || "Creator";
              const platforms = [
                ...new Set((creator.socialAccounts ?? []).map((account) => account.platform as SocialPlatform)),
              ];
              const followers = maxFollowers(creator);
              const views = maxViews(creator);
              const engagement = maxEngagement(creator);
              const price = startPrice(creator);
              const favorite = favorites.includes(creator.uid);

              return (
                <article className="premium-card overflow-hidden rounded-lg bg-white" key={creator.uid}>
                  <div className="grid gap-0 sm:grid-cols-[190px_1fr]">
                    <div className="relative min-h-56 bg-zinc-900">
                      {creator.profileImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt={name} className="h-full w-full object-cover" src={creator.profileImageUrl} />
                      ) : (
                        <div className="grid h-full place-items-center bg-gradient-to-br from-zinc-900 via-emerald-900 to-zinc-700 text-5xl font-black text-white">
                          {name.slice(0, 1)}
                        </div>
                      )}
                      <div className="absolute inset-x-3 top-3 flex gap-2">
                        {creator.verified ? <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-zinc-950">Verifiziert</span> : null}
                        {creator.ugcAvailable ? <span className="rounded-full bg-cyan-200 px-3 py-1 text-xs font-black text-zinc-950">UGC</span> : null}
                      </div>
                    </div>
                    <div className="grid gap-5 p-5">
                      <div>
                        <h3 className="text-2xl font-black tracking-tight text-zinc-950">{name}</h3>
                        <p className="mt-1 text-sm font-medium text-zinc-500">
                          {[creator.city, creator.country, creator.language].filter(Boolean).join(" · ") || "Keine Standortdaten"}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(creator.categories ?? []).slice(0, 4).map((category) => (
                            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-bold text-zinc-700" key={category}>
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                      <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                        <div className="rounded-lg bg-zinc-50 p-3"><dt className="text-zinc-500">Follower</dt><dd className="mt-1 font-black">{followers.toLocaleString("de-DE")}</dd></div>
                        <div className="rounded-lg bg-zinc-50 p-3"><dt className="text-zinc-500">Views</dt><dd className="mt-1 font-black">{views.toLocaleString("de-DE")}</dd></div>
                        <div className="rounded-lg bg-zinc-50 p-3"><dt className="text-zinc-500">Engagement</dt><dd className="mt-1 font-black">{engagement}%</dd></div>
                        <div className="rounded-lg bg-zinc-50 p-3"><dt className="text-zinc-500">Ab Preis</dt><dd className="mt-1 font-black">{price ? `${price.toLocaleString("de-DE")} €` : "-"}</dd></div>
                      </dl>
                      <p className="line-clamp-2 text-sm leading-6 text-zinc-600">{creator.shortBio || creator.bio || "Noch keine Bio hinterlegt."}</p>
                      <div className="flex flex-wrap gap-2">
                        <Link className="premium-button-secondary rounded-lg px-4 py-2.5 text-sm font-black" href={`/company/creators/${creator.uid}`}>
                          Profil ansehen
                        </Link>
                        <Link className="premium-button rounded-lg px-4 py-2.5 text-sm font-black" href={`/company/offers/new?recipientId=${creator.uid}&recipientName=${encodeURIComponent(name)}`}>
                          Angebot senden
                        </Link>
                        <button className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-black" onClick={() => toggleFavorite(creator.uid)} type="button">
                          {favorite ? "Favorit entfernen" : "Favorisieren"}
                        </button>
                      </div>
                      <p className="text-xs font-semibold text-zinc-400">
                        Plattformen: {platforms.join(", ") || "Keine Socials"}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {!loading && filteredCreators.length === 0 ? (
            <p className="premium-panel rounded-lg p-6 text-sm text-zinc-500">
              Keine passenden Creator gefunden. Passe die Filter an oder setze sie zurück.
            </p>
          ) : null}
        </section>
      </DashboardShell>
    </ProtectedPage>
  );
}
