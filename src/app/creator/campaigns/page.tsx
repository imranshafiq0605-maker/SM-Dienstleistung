"use client";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { ProtectedPage } from "@/components/auth/protected-page";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { FileUploadField, TextAreaField, TextField } from "@/components/ui/form-field";
import { db } from "@/lib/firebase";
import { uploadProfileFiles } from "@/lib/storage-upload";
import type { Campaign, CreatorProfile } from "@/types/creatorflow";

function maxFollowers(profile: CreatorProfile | null) {
  if (!profile) return 0;
  return Math.max(0, ...(profile.socialAccounts ?? []).map((account) => account.followers ?? 0));
}

function maxEngagement(profile: CreatorProfile | null) {
  if (!profile) return 0;
  return Math.max(0, ...(profile.socialAccounts ?? []).map((account) => account.engagementRate ?? 0));
}

function creatorPrice(profile: CreatorProfile | null, format: string) {
  if (!profile) return 0;

  const normalized = format.toLowerCase();
  if (normalized.includes("story")) return profile.priceStory || profile.minimumPrice || 0;
  if (normalized.includes("reel")) return profile.priceReel || profile.minimumPrice || 0;
  if (normalized.includes("tiktok")) return profile.priceTikTok || profile.minimumPrice || 0;
  if (normalized.includes("short")) return profile.priceYouTubeShort || profile.minimumPrice || 0;
  if (normalized.includes("youtube")) return profile.priceYouTubeVideo || profile.minimumPrice || 0;
  if (normalized.includes("ugc")) return profile.priceUgcVideo || profile.minimumPrice || 0;
  return profile.minimumPrice || 0;
}

function campaignMatches(campaign: Campaign, profile: CreatorProfile | null) {
  if (!profile) return false;

  const followerCount = maxFollowers(profile);
  const engagement = maxEngagement(profile);
  const price = creatorPrice(profile, campaign.format);
  const creatorPlatforms = (profile.socialAccounts ?? []).map((account) => account.platform);
  const categoryMatches = !campaign.category || (profile.categories ?? []).includes(campaign.category);
  const platformMatches =
    !campaign.platforms?.length ||
    campaign.platforms.some((platform) => creatorPlatforms.includes(platform));
  const followerMinMatches = !campaign.matchFollowerMin || followerCount >= campaign.matchFollowerMin;
  const followerMaxMatches = !campaign.matchFollowerMax || followerCount <= campaign.matchFollowerMax;
  const priceMinMatches = !campaign.feeMin || price >= campaign.feeMin;
  const priceMaxMatches = !campaign.feeMax || price <= campaign.feeMax;
  const countryMatches =
    !campaign.matchCountry ||
    profile.country.toLowerCase().includes(campaign.matchCountry.toLowerCase());
  const languageMatches =
    !campaign.matchLanguage ||
    profile.language.toLowerCase().includes(campaign.matchLanguage.toLowerCase());
  const engagementMatches =
    !campaign.matchEngagementMin || engagement >= campaign.matchEngagementMin;
  const genderMatches = !campaign.matchGender || profile.gender === campaign.matchGender;

  return (
    categoryMatches &&
    platformMatches &&
    followerMinMatches &&
    followerMaxMatches &&
    priceMinMatches &&
    priceMaxMatches &&
    countryMatches &&
    languageMatches &&
    engagementMatches &&
    genderMatches
  );
}

function formatMoney(min: number, max: number) {
  if (!min && !max) return "-";
  if (min && max) return `${min.toLocaleString("de-DE")} - ${max.toLocaleString("de-DE")} EUR`;
  if (min) return `ab ${min.toLocaleString("de-DE")} EUR`;
  return `bis ${max.toLocaleString("de-DE")} EUR`;
}

export default function CreatorCampaignsPage() {
  const { appUser } = useAuth();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [openApplicationId, setOpenApplicationId] = useState<string | null>(null);
  const [applicationForm, setApplicationForm] = useState({
    desiredFee: "",
    message: "",
    fitReason: "",
    videoIdea: "",
    publishDate: "",
  });
  const [applicationFiles, setApplicationFiles] = useState<FileList | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!appUser) return;

    async function loadData() {
      if (!appUser) return;

      const [profileSnapshot, campaignsSnapshot] = await Promise.all([
        getDoc(doc(db, "creatorProfiles", appUser.uid)),
        getDocs(query(collection(db, "campaigns"), where("status", "==", "active"))),
      ]);

      setProfile(profileSnapshot.exists() ? (profileSnapshot.data() as CreatorProfile) : null);
      setCampaigns(
        campaignsSnapshot.docs.map((campaignDoc) => ({
          ...(campaignDoc.data() as Campaign),
          id: campaignDoc.id,
        })),
      );
      setLoading(false);
    }

    void loadData();
  }, [appUser]);

  const matchingCampaigns = useMemo(
    () => campaigns.filter((campaign) => campaignMatches(campaign, profile)),
    [campaigns, profile],
  );

  function updateApplicationField(
    field: keyof typeof applicationForm,
    value: string,
  ) {
    setApplicationForm((current) => ({ ...current, [field]: value }));
  }

  async function submitApplication(
    campaign: Campaign,
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    if (!appUser) return;

    setSubmittingId(campaign.id);
    setSuccessMessage("");

    const uploadedFiles = await uploadProfileFiles(
      applicationFiles,
      `applications/${campaign.id}/${appUser.uid}`,
    );

    await addDoc(collection(db, "applications"), {
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      companyId: campaign.companyId,
      companyName: campaign.companyName,
      creatorId: appUser.uid,
      creatorName: appUser.displayName,
      desiredFee: Number(applicationForm.desiredFee.replace(",", ".")) || 0,
      message: applicationForm.message,
      fitReason: applicationForm.fitReason,
      videoIdea: applicationForm.videoIdea,
      publishDate: applicationForm.publishDate,
      files: uploadedFiles,
      status: "applied",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    setApplicationForm({
      desiredFee: "",
      message: "",
      fitReason: "",
      videoIdea: "",
      publishDate: "",
    });
    setApplicationFiles(null);
    setOpenApplicationId(null);
    setSubmittingId(null);
    setSuccessMessage("Bewerbung wurde gesendet.");
  }

  return (
    <ProtectedPage role="creator">
      <DashboardShell title="Passende Kampagnen">
        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Matching-Regeln
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {loading ? "Kampagnen werden geladen..." : `${matchingCampaigns.length} passende Kampagnen`}
          </h2>
          <p className="mt-3 text-sm text-zinc-600">
            Es werden nur aktive Kampagnen angezeigt, die zu Kategorie,
            Plattform, Followerbereich, Preisbereich, Land, Sprache, Engagement
            und optional Geschlecht passen.
          </p>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {matchingCampaigns.map((campaign) => (
            <article className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" key={campaign.id}>
              <div>
                <p className="text-sm font-medium text-zinc-500">{campaign.companyName}</p>
                <h3 className="mt-1 text-2xl font-semibold">{campaign.title}</h3>
                <p className="mt-2 text-sm text-zinc-600">{campaign.productName}</p>
              </div>

              {campaign.productImages?.[0]?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={campaign.productName || campaign.title} className="h-48 w-full rounded-lg object-cover" src={campaign.productImages[0].url} />
              ) : null}

              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div><dt className="text-zinc-500">Kategorie</dt><dd>{campaign.category || "-"}</dd></div>
                <div><dt className="text-zinc-500">Plattform</dt><dd>{campaign.platforms?.join(", ") || "-"}</dd></div>
                <div><dt className="text-zinc-500">Format</dt><dd>{campaign.format || "-"}</dd></div>
                <div><dt className="text-zinc-500">Gage</dt><dd>{formatMoney(campaign.feeMin, campaign.feeMax)}</dd></div>
                <div><dt className="text-zinc-500">Bewerbungsfrist</dt><dd>{campaign.applicationDeadline || "-"}</dd></div>
                <div><dt className="text-zinc-500">Creator Anzahl</dt><dd>{campaign.creatorCount || "-"}</dd></div>
              </dl>

              <p className="text-sm text-zinc-600">{campaign.briefing || campaign.productDescription}</p>

              <div className="flex flex-wrap gap-2">
                <button className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold" type="button">Details ansehen</button>
                <button
                  className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white"
                  onClick={() =>
                    setOpenApplicationId(
                      openApplicationId === campaign.id ? null : campaign.id,
                    )
                  }
                  type="button"
                >
                  Bewerben
                </button>
                <button className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold" type="button">Merken</button>
              </div>

              {openApplicationId === campaign.id ? (
                <form
                  className="grid gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4"
                  onSubmit={(event) => void submitApplication(campaign, event)}
                >
                  <h4 className="font-semibold">Bewerbung senden</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Wunschgage" inputMode="decimal" value={applicationForm.desiredFee} onChange={(e) => updateApplicationField("desiredFee", e.target.value)} />
                    <TextField label="Veröffentlichungsdatum" type="date" value={applicationForm.publishDate} onChange={(e) => updateApplicationField("publishDate", e.target.value)} />
                  </div>
                  <TextAreaField label="Nachricht" value={applicationForm.message} onChange={(e) => updateApplicationField("message", e.target.value)} />
                  <TextAreaField label="Warum passt du?" value={applicationForm.fitReason} onChange={(e) => updateApplicationField("fitReason", e.target.value)} />
                  <TextAreaField label="Videoidee" value={applicationForm.videoIdea} onChange={(e) => updateApplicationField("videoIdea", e.target.value)} />
                  <FileUploadField files={applicationFiles} label="Dateien" onChange={setApplicationFiles} />
                  <button className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white disabled:bg-zinc-400" disabled={submittingId === campaign.id} type="submit">
                    {submittingId === campaign.id ? "Sendet..." : "Bewerbung absenden"}
                  </button>
                </form>
              ) : null}
            </article>
          ))}
        </section>

        {successMessage ? (
          <p className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
            {successMessage}
          </p>
        ) : null}

        {!loading && matchingCampaigns.length === 0 ? (
          <p className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
            Keine passenden Kampagnen gefunden. Ergaenze Profil, Socials und Preise, damit Matching besser funktioniert.
          </p>
        ) : null}
      </DashboardShell>
    </ProtectedPage>
  );
}
