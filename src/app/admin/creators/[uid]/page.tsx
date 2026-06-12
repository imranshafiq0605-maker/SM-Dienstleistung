"use client";

import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminSection, StatusBadge } from "@/components/admin/admin-ui";
import { SelectField, TextAreaField, TextField } from "@/components/ui/form-field";
import { db } from "@/lib/firebase";
import type { CreatorProfile, Gender, UserStatus } from "@/types/creatorflow";

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
  screenshots: [],
  socialAccounts: [],
  status: "pending",
  uid: "",
};

export default function AdminCreatorDetailPage() {
  const params = useParams<{ uid: string }>();
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let mounted = true;

    getDoc(doc(db, "creatorProfiles", params.uid)).then((snapshot) => {
      if (!mounted) return;

      setCreator(
        snapshot.exists()
          ? ({ ...emptyCreator, ...(snapshot.data() as CreatorProfile), uid: params.uid })
          : { ...emptyCreator, uid: params.uid },
      );
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!creator) return;

    setSaving(true);
    setSaved(false);

    await updateDoc(doc(db, "creatorProfiles", creator.uid), {
      artistName: creator.artistName,
      audience: creator.audience,
      availability: creator.availability,
      bio: creator.bio,
      categories: creator.categories,
      city: creator.city,
      country: creator.country,
      firstName: creator.firstName,
      gender: creator.gender,
      language: creator.language,
      lastName: creator.lastName,
      minimumPrice: Number(creator.minimumPrice || 0),
      phone: creator.phone,
      priceReel: Number(creator.priceReel || 0),
      priceStory: Number(creator.priceStory || 0),
      priceTikTok: Number(creator.priceTikTok || 0),
      priceUgcVideo: Number(creator.priceUgcVideo || 0),
      priceYouTubeShort: Number(creator.priceYouTubeShort || 0),
      priceYouTubeVideo: Number(creator.priceYouTubeVideo || 0),
      status: creator.status,
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "users", creator.uid), {
      status: creator.status,
      updatedAt: serverTimestamp(),
    });

    setSaving(false);
    setSaved(true);
  }

  return (
    <AdminShell
      subtitle="Öffne Creatorprofile, ändere Stammdaten, Preise, Kategorien und Freigabestatus."
      title="Creator bearbeiten"
    >
      {!creator ? (
        <AdminSection title="Profil wird geladen">
          <p className="text-sm text-zinc-500">Creator wird geladen...</p>
        </AdminSection>
      ) : (
        <form className="grid gap-6" onSubmit={handleSubmit}>
          <AdminSection
            action={<StatusBadge status={creator.status} />}
            eyebrow="Creator Profil"
            title={creator.artistName || `${creator.firstName} ${creator.lastName}` || "Creator"}
          >
            <div className="grid gap-4 md:grid-cols-3">
              <TextField
                label="Vorname"
                onChange={(event) => updateField("firstName", event.target.value)}
                value={creator.firstName}
              />
              <TextField
                label="Nachname"
                onChange={(event) => updateField("lastName", event.target.value)}
                value={creator.lastName}
              />
              <TextField
                label="Künstlername"
                onChange={(event) => updateField("artistName", event.target.value)}
                value={creator.artistName}
              />
              <TextField
                label="Telefon"
                onChange={(event) => updateField("phone", event.target.value)}
                value={creator.phone}
              />
              <TextField
                label="Stadt"
                onChange={(event) => updateField("city", event.target.value)}
                value={creator.city}
              />
              <TextField
                label="Land"
                onChange={(event) => updateField("country", event.target.value)}
                value={creator.country}
              />
              <TextField
                label="Sprache"
                onChange={(event) => updateField("language", event.target.value)}
                value={creator.language}
              />
              <SelectField
                label="Geschlecht"
                onChange={(event) => updateField("gender", event.target.value as Gender)}
                value={creator.gender}
              >
                <option value="male">Männlich</option>
                <option value="female">Weiblich</option>
                <option value="diverse">Divers</option>
                <option value="not_specified">Keine Angabe</option>
              </SelectField>
              <SelectField
                label="Status"
                onChange={(event) => updateField("status", event.target.value as UserStatus)}
                value={creator.status}
              >
                <option value="pending">Wartet</option>
                <option value="active">Aktiv</option>
                <option value="rejected">Gesperrt</option>
              </SelectField>
            </div>
            <div className="mt-4 grid gap-4">
              <TextAreaField
                label="Bio"
                onChange={(event) => updateField("bio", event.target.value)}
                value={creator.bio}
              />
              <TextField
                label="Kategorien, durch Komma getrennt"
                onChange={(event) =>
                  updateField(
                    "categories",
                    event.target.value.split(",").map((item) => item.trim()).filter(Boolean),
                  )
                }
                value={creator.categories.join(", ")}
              />
            </div>
          </AdminSection>

          <AdminSection eyebrow="Preise" title="Creator-Preise bearbeiten">
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
                  onChange={(event) =>
                    updateField(key as keyof CreatorProfile, Number(event.target.value) as never)
                  }
                  type="number"
                  value={String(creator[key as keyof CreatorProfile] || 0)}
                />
              ))}
            </div>
          </AdminSection>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="premium-button rounded-lg px-5 py-3 text-sm font-black disabled:opacity-50"
              disabled={saving}
              type="submit"
            >
              {saving ? "Speichert..." : "Änderungen speichern"}
            </button>
            <Link
              className="premium-button-secondary rounded-lg px-5 py-3 text-center text-sm font-black"
              href="/admin/creators"
            >
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
