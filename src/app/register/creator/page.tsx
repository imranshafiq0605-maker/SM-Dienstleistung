"use client";

import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState } from "react";
import { TextAreaField, TextField } from "@/components/ui/form-field";
import { auth, db, storage } from "@/lib/firebase";

const creatorCategories = [
  "Beauty",
  "Fashion",
  "Fitness",
  "Gaming",
  "Lifestyle",
  "Food",
  "Travel",
  "Business",
  "Tech",
  "UGC",
];

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
        city: form.city,
        country: form.country,
        shortBio: form.shortBio,
        categories,
        profileImageUrl,
      });

      router.replace("/creator/dashboard");
    } catch {
      setError("Registrierung fehlgeschlagen. Bitte pruefe deine Angaben.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-950">
      <form
        className="mx-auto grid w-full max-w-3xl gap-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
        onSubmit={handleSubmit}
      >
        <div>
          <Link className="text-sm font-semibold text-zinc-500" href="/">
            CreatorFlow
          </Link>
          <h1 className="mt-3 text-3xl font-semibold">Creator registrieren</h1>
          <p className="mt-2 text-sm text-zinc-500">
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

        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          Profilbild
          <input accept="image/*" onChange={handleFile} type="file" />
        </label>

        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

        <button
          className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Erstelle Account..." : "Creator Account erstellen"}
        </button>
      </form>
    </main>
  );
}
