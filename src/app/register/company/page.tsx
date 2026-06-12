"use client";

import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState } from "react";
import { TextAreaField, TextField } from "@/components/ui/form-field";
import { auth, db, storage } from "@/lib/firebase";

export default function CompanyRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    password: "",
    phone: "",
    website: "",
    industry: "",
    city: "",
    country: "",
    description: "",
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    setLogo(event.target.files?.[0] ?? null);
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

      await updateProfile(credential.user, { displayName: form.companyName });

      let logoUrl: string | null = null;

      if (logo) {
        const logoRef = ref(storage, `companyProfiles/${uid}/${logo.name}`);
        await uploadBytes(logoRef, logo);
        logoUrl = await getDownloadURL(logoRef);
      }

      const baseData = {
        uid,
        email: form.email,
        status: "pending",
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", uid), {
        ...baseData,
        role: "company",
        displayName: form.companyName,
      });

      await setDoc(doc(db, "companyProfiles", uid), {
        ...baseData,
        companyName: form.companyName,
        contactPerson: form.contactPerson,
        phone: form.phone,
        website: form.website,
        industry: form.industry,
        city: form.city,
        country: form.country,
        description: form.description,
        logoUrl,
      });

      router.replace("/company/dashboard");
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
          <h1 className="mt-3 text-3xl font-semibold">
            Unternehmen registrieren
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Unternehmen werden vor Kontakt- und Kampagnenfunktionen freigegeben.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Firmenname" required value={form.companyName} onChange={(e) => updateField("companyName", e.target.value)} />
          <TextField label="Ansprechpartner" required value={form.contactPerson} onChange={(e) => updateField("contactPerson", e.target.value)} />
          <TextField label="E-Mail" required type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
          <TextField label="Passwort" required minLength={6} type="password" value={form.password} onChange={(e) => updateField("password", e.target.value)} />
          <TextField label="Telefonnummer" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
          <TextField label="Website" value={form.website} onChange={(e) => updateField("website", e.target.value)} />
          <TextField label="Branche" value={form.industry} onChange={(e) => updateField("industry", e.target.value)} />
          <TextField label="Stadt" value={form.city} onChange={(e) => updateField("city", e.target.value)} />
          <TextField label="Land" value={form.country} onChange={(e) => updateField("country", e.target.value)} />
        </div>

        <TextAreaField
          label="Beschreibung"
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
        />

        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          Logo
          <input accept="image/*" onChange={handleFile} type="file" />
        </label>

        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

        <button
          className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Erstelle Account..." : "Unternehmen Account erstellen"}
        </button>
      </form>
    </main>
  );
}
