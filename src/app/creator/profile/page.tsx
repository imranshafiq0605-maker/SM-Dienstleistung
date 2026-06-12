"use client";

import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { FormEvent, useEffect, useState } from "react";
import { ProtectedPage } from "@/components/auth/protected-page";
import { useAuth } from "@/components/auth/auth-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { FileUploadField, SelectField, TextAreaField, TextField } from "@/components/ui/form-field";
import { db } from "@/lib/firebase";
import { creatorCategories } from "@/lib/profile-options";
import { uploadProfileFile } from "@/lib/storage-upload";
import type { CreatorProfile, Gender } from "@/types/creatorflow";

const initialForm = {
  firstName: "",
  lastName: "",
  artistName: "",
  phone: "",
  address: "",
  birthDate: "",
  gender: "not_specified" as Gender,
  country: "",
  city: "",
  language: "",
  bio: "",
  audience: "",
  availability: "",
  minimumPrice: "",
  priceStory: "",
  priceReel: "",
  priceTikTok: "",
  priceYouTubeShort: "",
  priceYouTubeVideo: "",
  priceUgcVideo: "",
};

function toMoney(value: string) {
  return Number(value.replace(",", ".")) || 0;
}

export default function CreatorProfilePage() {
  const { appUser } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!appUser) return;

    getDoc(doc(db, "creatorProfiles", appUser.uid)).then((snapshot) => {
      if (!snapshot.exists()) return;

      const profile = snapshot.data() as CreatorProfile;
      setForm({
        firstName: profile.firstName ?? "",
        lastName: profile.lastName ?? "",
        artistName: profile.artistName ?? "",
        phone: profile.phone ?? "",
        address: profile.address ?? "",
        birthDate: profile.birthDate ?? "",
        gender: profile.gender ?? "not_specified",
        country: profile.country ?? "",
        city: profile.city ?? "",
        language: profile.language ?? "",
        bio: profile.bio ?? profile.shortBio ?? "",
        audience: profile.audience ?? "",
        availability: profile.availability ?? "",
        minimumPrice: String(profile.minimumPrice ?? ""),
        priceStory: String(profile.priceStory ?? ""),
        priceReel: String(profile.priceReel ?? ""),
        priceTikTok: String(profile.priceTikTok ?? ""),
        priceYouTubeShort: String(profile.priceYouTubeShort ?? ""),
        priceYouTubeVideo: String(profile.priceYouTubeVideo ?? ""),
        priceUgcVideo: String(profile.priceUgcVideo ?? ""),
      });
      setCategories(profile.categories ?? []);
      setCurrentImageUrl(profile.profileImageUrl ?? null);
    });
  }, [appUser]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleCategory(category: string) {
    setCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!appUser) return;

    setSaving(true);
    setMessage("");

    let profileImageUrl = currentImageUrl;

    if (profileImage) {
      const uploaded = await uploadProfileFile(
        profileImage,
        `creatorProfiles/${appUser.uid}/profile`,
      );
      profileImageUrl = uploaded.url;
    }

    await updateDoc(doc(db, "creatorProfiles", appUser.uid), {
      ...form,
      bio: form.bio,
      shortBio: form.bio,
      categories,
      profileImageUrl,
      minimumPrice: toMoney(form.minimumPrice),
      priceStory: toMoney(form.priceStory),
      priceReel: toMoney(form.priceReel),
      priceTikTok: toMoney(form.priceTikTok),
      priceYouTubeShort: toMoney(form.priceYouTubeShort),
      priceYouTubeVideo: toMoney(form.priceYouTubeVideo),
      priceUgcVideo: toMoney(form.priceUgcVideo),
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "users", appUser.uid), {
      displayName: form.artistName || `${form.firstName} ${form.lastName}`,
      updatedAt: serverTimestamp(),
    });

    setCurrentImageUrl(profileImageUrl);
    setProfileImage(null);
    setMessage("Profil gespeichert.");
    setSaving(false);
  }

  return (
    <ProtectedPage role="creator">
      <DashboardShell title="Creator Profil bearbeiten">
        <form
          className="grid gap-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Vorname" value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} />
            <TextField label="Nachname" value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} />
            <TextField label="Künstlername" value={form.artistName} onChange={(e) => updateField("artistName", e.target.value)} />
            <TextField label="Telefon" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
            <TextField label="Adresse" value={form.address} onChange={(e) => updateField("address", e.target.value)} />
            <TextField label="Geburtsdatum" type="date" value={form.birthDate} onChange={(e) => updateField("birthDate", e.target.value)} />
            <SelectField label="Geschlecht" value={form.gender} onChange={(e) => updateField("gender", e.target.value)}>
              <option value="not_specified">Keine Angabe</option>
              <option value="male">Männlich</option>
              <option value="female">Weiblich</option>
              <option value="diverse">Divers</option>
            </SelectField>
            <TextField label="Land" value={form.country} onChange={(e) => updateField("country", e.target.value)} />
            <TextField label="Stadt" value={form.city} onChange={(e) => updateField("city", e.target.value)} />
            <TextField label="Sprache" value={form.language} onChange={(e) => updateField("language", e.target.value)} />
          </div>

          <TextAreaField label="Bio" value={form.bio} onChange={(e) => updateField("bio", e.target.value)} />
          <TextAreaField label="Zielgruppe" value={form.audience} onChange={(e) => updateField("audience", e.target.value)} />
          <TextField label="Verfügbarkeit" value={form.availability} onChange={(e) => updateField("availability", e.target.value)} />

          <fieldset className="grid gap-3">
            <legend className="text-sm font-medium text-zinc-700">Kategorien</legend>
            <div className="flex flex-wrap gap-2">
              {creatorCategories.map((category) => (
                <button
                  className={`rounded-full border px-3 py-2 text-sm font-medium ${
                    categories.includes(category)
                      ? "border-zinc-950 bg-zinc-950 text-white"
                      : "border-zinc-300 bg-white text-zinc-700"
                  }`}
                  key={category}
                  onClick={() => toggleCategory(category)}
                  type="button"
                >
                  {category}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="Mindestpreis" inputMode="decimal" value={form.minimumPrice} onChange={(e) => updateField("minimumPrice", e.target.value)} />
            <TextField label="Preis pro Story" inputMode="decimal" value={form.priceStory} onChange={(e) => updateField("priceStory", e.target.value)} />
            <TextField label="Preis pro Reel" inputMode="decimal" value={form.priceReel} onChange={(e) => updateField("priceReel", e.target.value)} />
            <TextField label="Preis pro TikTok" inputMode="decimal" value={form.priceTikTok} onChange={(e) => updateField("priceTikTok", e.target.value)} />
            <TextField label="Preis pro YouTube Short" inputMode="decimal" value={form.priceYouTubeShort} onChange={(e) => updateField("priceYouTubeShort", e.target.value)} />
            <TextField label="Preis pro YouTube Video" inputMode="decimal" value={form.priceYouTubeVideo} onChange={(e) => updateField("priceYouTubeVideo", e.target.value)} />
            <TextField label="Preis für UGC Video" inputMode="decimal" value={form.priceUgcVideo} onChange={(e) => updateField("priceUgcVideo", e.target.value)} />
          </div>

          <FileUploadField
            accept="image/*"
            files={profileImage}
            label="Profilbild"
            multiple={false}
            onChange={(selectedFiles) => setProfileImage(selectedFiles?.[0] ?? null)}
          />
          {currentImageUrl ? (
            <a className="text-sm font-medium text-zinc-700 underline" href={currentImageUrl} target="_blank">
              Aktuelles Profilbild ansehen
            </a>
          ) : null}

          {message ? <p className="text-sm font-medium text-green-700">{message}</p> : null}
          <button className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white disabled:bg-zinc-400" disabled={saving} type="submit">
            {saving ? "Speichert..." : "Profil speichern"}
          </button>
        </form>
      </DashboardShell>
    </ProtectedPage>
  );
}

