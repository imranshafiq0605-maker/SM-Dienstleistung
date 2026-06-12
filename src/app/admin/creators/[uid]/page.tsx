"use client";

import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminSection, StatusBadge } from "@/components/admin/admin-ui";
import { SelectField, TextAreaField, TextField } from "@/components/ui/form-field";
import { db } from "@/lib/firebase";
import type {
  CreatorProfile,
  Gender,
  SocialAccount,
  UploadedAsset,
  UserStatus,
} from "@/types/creatorflow";

const emptyCreator: CreatorProfile = {
  address: "",
  artistName: "",
  audience: "",
  availability: "",
  bio: "",
  birthDate: "",
  categories: [],
  city: "",
  country: "",
  createdAt: null,
  email: "",
  firstName: "",
  gender: "not_specified",
  language: "",
  lastName: "",
  mediaKit: [],
  minimumPrice: 0,
  phone: "",
  portfolio: [],
  priceReel: 0,
  priceStory: 0,
  priceTikTok: 0,
  priceUgcVideo: 0,
  priceYouTubeShort: 0,
  priceYouTubeVideo: 0,
  profileImageUrl: null,
  rating: 0,
  screenshots: [],
  shortBio: "",
  socialAccounts: [],
  status: "pending",
  ugcAvailable: false,
  uid: "",
  verified: false,
};

function formatJson(value: unknown) {
  return JSON.stringify(value ?? [], null, 2);
}

function parseJsonArray<T>(value: string, fallback: T[]) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

export default function AdminCreatorDetailPage() {
  const params = useParams<{ uid: string }>();
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [socialsJson, setSocialsJson] = useState("[]");
  const [mediaKitJson, setMediaKitJson] = useState("[]");
  const [screenshotsJson, setScreenshotsJson] = useState("[]");
  const [portfolioJson, setPortfolioJson] = useState("[]");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let mounted = true;

    getDoc(doc(db, "creatorProfiles", params.uid)).then((snapshot) => {
      if (!mounted) return;

      const loaded = snapshot.exists()
        ? { ...emptyCreator, ...(snapshot.data() as CreatorProfile), uid: params.uid }
        : { ...emptyCreator, uid: params.uid };

      setCreator(loaded);
      setSocialsJson(formatJson(loaded.socialAccounts));
      setMediaKitJson(formatJson(loaded.mediaKit));
      setScreenshotsJson(formatJson(loaded.screenshots));
      setPortfolioJson(formatJson(loaded.portfolio));
    });

    return () => {
      mounted = false;
    };
  }, [params.uid]);

  function updateField<K extends keyof CreatorProfile>(
    key: K,
    value: CreatorProfile[K],
  ) {
    setCreator((current) => (current ? { ...current, [key]: value } : current));
  }

  function updateNumberField(key: keyof CreatorProfile, value: string) {
    setCreator((current) =>
      current ? { ...current, [key]: Number(value || 0) } : current,
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!creator) return;

    setSaving(true);
    setSaved(false);

    const socialAccounts = parseJsonArray<SocialAccount>(
      socialsJson,
      creator.socialAccounts,
    );
    const mediaKit = parseJsonArray<UploadedAsset>(mediaKitJson, creator.mediaKit);
    const screenshots = parseJsonArray<UploadedAsset>(
      screenshotsJson,
      creator.screenshots,
    );
    const portfolio = parseJsonArray<UploadedAsset>(portfolioJson, creator.portfolio);

    await updateDoc(doc(db, "creatorProfiles", creator.uid), {
      address: creator.address,
      artistName: creator.artistName,
      audience: creator.audience,
      availability: creator.availability,
      bio: creator.bio,
      birthDate: creator.birthDate,
      categories: creator.categories,
      city: creator.city,
      country: creator.country,
      email: creator.email,
      firstName: creator.firstName,
      gender: creator.gender,
      language: creator.language,
      lastName: creator.lastName,
      mediaKit,
      minimumPrice: Number(creator.minimumPrice || 0),
      phone: creator.phone,
      portfolio,
      priceReel: Number(creator.priceReel || 0),
      priceStory: Number(creator.priceStory || 0),
      priceTikTok: Number(creator.priceTikTok || 0),
      priceUgcVideo: Number(creator.priceUgcVideo || 0),
      priceYouTubeShort: Number(creator.priceYouTubeShort || 0),
      priceYouTubeVideo: Number(creator.priceYouTubeVideo || 0),
      profileImageUrl: creator.profileImageUrl || null,
      rating: Number(creator.rating || 0),
      screenshots,
      shortBio: creator.shortBio || "",
      socialAccounts,
      status: creator.status,
      ugcAvailable: Boolean(creator.ugcAvailable),
      updatedAt: serverTimestamp(),
      verified: Boolean(creator.verified),
    });

    await updateDoc(doc(db, "users", creator.uid), {
      displayName:
        creator.artistName || `${creator.firstName} ${creator.lastName}`.trim(),
      email: creator.email,
      status: creator.status,
      updatedAt: serverTimestamp(),
    });

    setCreator((current) =>
      current
        ? { ...current, mediaKit, portfolio, screenshots, socialAccounts }
        : current,
    );
    setSaving(false);
    setSaved(true);
  }

  return (
    <AdminShell
      subtitle="Öffne Creatorprofile und ändere wirklich alle wichtigen Profilfelder, Preise, Socials, Uploads und Freigaben."
      title="Creator komplett bearbeiten"
    >
      {!creator ? (
        <AdminSection title="Profil wird geladen">
          <p className="text-sm text-zinc-500">Creator wird geladen...</p>
        </AdminSection>
      ) : (
        <form className="grid gap-6" onSubmit={handleSubmit}>
          <AdminSection
            action={<StatusBadge status={creator.status} />}
            eyebrow="Basisdaten"
            title={
              creator.artistName ||
              `${creator.firstName} ${creator.lastName}`.trim() ||
              "Creator"
            }
          >
            <div className="grid gap-4 md:grid-cols-3">
              <TextField label="Vorname" onChange={(e) => updateField("firstName", e.target.value)} value={creator.firstName} />
              <TextField label="Nachname" onChange={(e) => updateField("lastName", e.target.value)} value={creator.lastName} />
              <TextField label="Künstlername" onChange={(e) => updateField("artistName", e.target.value)} value={creator.artistName} />
              <TextField label="E-Mail" onChange={(e) => updateField("email", e.target.value)} type="email" value={creator.email} />
              <TextField label="Telefon" onChange={(e) => updateField("phone", e.target.value)} value={creator.phone} />
              <TextField label="Geburtsdatum" onChange={(e) => updateField("birthDate", e.target.value)} type="date" value={creator.birthDate} />
              <TextField label="Adresse" onChange={(e) => updateField("address", e.target.value)} value={creator.address} />
              <TextField label="Stadt" onChange={(e) => updateField("city", e.target.value)} value={creator.city} />
              <TextField label="Land" onChange={(e) => updateField("country", e.target.value)} value={creator.country} />
              <TextField label="Sprache" onChange={(e) => updateField("language", e.target.value)} value={creator.language} />
              <TextField label="Profilbild URL" onChange={(e) => updateField("profileImageUrl", e.target.value || null)} value={creator.profileImageUrl || ""} />
              <SelectField label="Geschlecht" onChange={(e) => updateField("gender", e.target.value as Gender)} value={creator.gender}>
                <option value="male">Männlich</option>
                <option value="female">Weiblich</option>
                <option value="diverse">Divers</option>
                <option value="not_specified">Keine Angabe</option>
              </SelectField>
              <SelectField label="Status" onChange={(e) => updateField("status", e.target.value as UserStatus)} value={creator.status}>
                <option value="pending">Wartet</option>
                <option value="active">Aktiv</option>
                <option value="rejected">Gesperrt</option>
              </SelectField>
              <TextField label="Bewertung" min={0} max={5} onChange={(e) => updateNumberField("rating", e.target.value)} step="0.1" type="number" value={String(creator.rating || 0)} />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white/80 p-4 text-sm font-semibold text-zinc-700">
                <input checked={Boolean(creator.verified)} onChange={(e) => updateField("verified", e.target.checked)} type="checkbox" />
                Verifiziert
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white/80 p-4 text-sm font-semibold text-zinc-700">
                <input checked={Boolean(creator.ugcAvailable)} onChange={(e) => updateField("ugcAvailable", e.target.checked)} type="checkbox" />
                UGC verfügbar
              </label>
            </div>
          </AdminSection>

          <AdminSection eyebrow="Profilinhalt" title="Bio, Zielgruppe und Kategorien">
            <div className="grid gap-4">
              <TextAreaField label="Bio" onChange={(e) => updateField("bio", e.target.value)} value={creator.bio} />
              <TextAreaField label="Kurzbeschreibung" onChange={(e) => updateField("shortBio", e.target.value)} value={creator.shortBio || ""} />
              <TextAreaField label="Zielgruppe" onChange={(e) => updateField("audience", e.target.value)} value={creator.audience} />
              <TextField label="Verfügbarkeit" onChange={(e) => updateField("availability", e.target.value)} value={creator.availability} />
              <TextField
                label="Kategorien, durch Komma getrennt"
                onChange={(e) =>
                  updateField(
                    "categories",
                    e.target.value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  )
                }
                value={creator.categories.join(", ")}
              />
            </div>
          </AdminSection>

          <AdminSection eyebrow="Preise" title="Alle Creator-Preise">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["minimumPrice", "Mindestpreis"],
                ["priceStory", "Preis pro Story"],
                ["priceReel", "Preis pro Reel"],
                ["priceTikTok", "Preis pro TikTok"],
                ["priceYouTubeShort", "Preis pro YouTube Short"],
                ["priceYouTubeVideo", "Preis pro YouTube Video"],
                ["priceUgcVideo", "Preis für UGC Video"],
              ].map(([key, label]) => (
                <TextField
                  key={key}
                  label={label}
                  min={0}
                  onChange={(e) => updateNumberField(key as keyof CreatorProfile, e.target.value)}
                  type="number"
                  value={String(creator[key as keyof CreatorProfile] || 0)}
                />
              ))}
            </div>
          </AdminSection>

          <AdminSection eyebrow="Socials & Uploads" title="Rohdaten vollständig bearbeiten">
            <div className="grid gap-4">
              <TextAreaField label="Social Accounts JSON" onChange={(e) => setSocialsJson(e.target.value)} value={socialsJson} />
              <TextAreaField label="Media Kit Uploads JSON" onChange={(e) => setMediaKitJson(e.target.value)} value={mediaKitJson} />
              <TextAreaField label="Screenshots Uploads JSON" onChange={(e) => setScreenshotsJson(e.target.value)} value={screenshotsJson} />
              <TextAreaField label="Portfolio Uploads JSON" onChange={(e) => setPortfolioJson(e.target.value)} value={portfolioJson} />
            </div>
          </AdminSection>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="premium-button rounded-lg px-5 py-3 text-sm font-black disabled:opacity-50"
              disabled={saving}
              type="submit"
            >
              {saving ? "Speichert..." : "Alles speichern"}
            </button>
            <Link className="premium-button-secondary rounded-lg px-5 py-3 text-center text-sm font-black" href="/admin/creators">
              Zurück zu Creator
            </Link>
            {saved ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                Gespeichert.
              </p>
            ) : null}
          </div>
        </form>
      )}
    </AdminShell>
  );
}
