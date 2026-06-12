"use client";

import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState } from "react";
import { TextAreaField, TextField } from "@/components/ui/form-field";
import { auth, db, storage } from "@/lib/firebase";
import { creatorCategories } from "@/lib/profile-options";

export default function CreatorRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    artistName: "",
    email: "",
    password: "",
    phone: "",
    city: "",
    country: "",
    shortBio: "",
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    setProfileImage(event.target.files?.[0] ?? null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password,
      );
      const uid = credential.user.uid;
      const displayName = form.artistName || `${form.firstName} ${form.lastName}`;

      await updateProfile(credential.user, { displayName });

      let profileImageUrl: string | null = null;

      if (profileImage) {
        const imageRef = ref(storage, `creatorProfiles/${uid}/${profileImage.name}`);
        await uploadBytes(imageRef, profileImage);
        profileImageUrl = await getDownloadURL(imageRef);
      }

      const baseData = {
        uid,
        email: form.email,
        status: "pending",
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", uid), {
        ...baseData,
        role: "creator",
        displayName,
      });

      await setDoc(doc(db, "creatorProfiles", uid), {
        ...baseData,
        firstName: form.firstName,
        lastName: form.lastName,
        artistName: form.artistName,
        phone: form.phone,
        address: "",
        birthDate: "",
        gender: "not_specified",
        city: form.city,
        country: form.country,
        language: "",
        bio: form.shortBio,
        shortBio: form.shortBio,
        categories,
        audience: "",
        availability: "",
        minimumPrice: 0,
        priceStory: 0,
        priceReel: 0,
        priceTikTok: 0,
        priceYouTubeShort: 0,
        priceYouTubeVideo: 0,
        priceUgcVideo: 0,
        rating: 0,
        verified: false,
        ugcAvailable: false,
        profileImageUrl,
        mediaKit: [],
        screenshots: [],
        portfolio: [],
        socialAccounts: [],
      });

      router.replace("/creator/dashboard");
    } catch {
      setError("Registrierung fehlgeschlagen. Bitte pruefe deine Angaben.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="premium-shell min-h-screen px-4 py-10 text-zinc-950 sm:px-6">
      <form
        className="premium-panel mx-auto grid w-full max-w-4xl gap-7 rounded-lg p-6 sm:p-8"
        onSubmit={handleSubmit}
      >
        <div>
          <Link className="inline-flex items-center gap-3" href="/">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-zinc-950 text-sm font-bold text-white">
              CF
            </span>
            <span className="font-semibold">CreatorFlow</span>
          </Link>
          <h1 className="mt-7 text-3xl font-semibold tracking-tight">
            Creator Profil anlegen
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Dein Profil wird nach der Registrierung vom Admin freigegeben.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Vorname" required value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} />
          <TextField label="Nachname" required value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} />
          <TextField label="Kuenstlername" value={form.artistName} onChange={(e) => updateField("artistName", e.target.value)} />
          <TextField label="Telefonnummer" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
          <TextField label="E-Mail" required type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
          <TextField label="Passwort" required minLength={6} type="password" value={form.password} onChange={(e) => updateField("password", e.target.value)} />
          <TextField label="Stadt" value={form.city} onChange={(e) => updateField("city", e.target.value)} />
          <TextField label="Land" value={form.country} onChange={(e) => updateField("country", e.target.value)} />
        </div>

        <TextAreaField
          label="Kurzbeschreibung"
          value={form.shortBio}
          onChange={(e) => updateField("shortBio", e.target.value)}
        />

        <fieldset className="grid gap-3">
          <legend className="text-sm font-semibold text-zinc-700">Kategorien</legend>
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

        <label className="grid gap-2 text-sm font-semibold text-zinc-700">
          Profilbild
          <input accept="image/*" onChange={handleFile} type="file" />
        </label>

        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

        <button
          className="premium-button rounded-lg px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:bg-zinc-400"
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Erstelle Account..." : "Creator Account erstellen"}
        </button>
      </form>
    </main>
  );
}
