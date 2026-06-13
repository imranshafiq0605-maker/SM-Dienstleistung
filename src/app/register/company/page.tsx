"use client";

import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { FileUploadField, SelectField, TextAreaField, TextField } from "@/components/ui/form-field";
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
    legalForm: "",
    taxNumber: "",
    vatId: "",
    vatExempt: "no",
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
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
        address: "",
        billingAddress: "",
        city: form.city,
        country: form.country,
        description: form.description,
        legalForm: form.legalForm,
        taxNumber: form.taxNumber,
        vatId: form.vatId,
        vatExempt: form.vatExempt === "yes",
        logoUrl,
        socialLinks: [],
        activeCampaigns: 0,
        budgetMin: 0,
        budgetMax: 0,
        verified: false,
      });

      router.replace("/company/dashboard");
    } catch {
      setError("Registrierung fehlgeschlagen. Bitte prüfe deine Angaben.");
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
          <BrandLogo />
          <h1 className="mt-7 text-3xl font-semibold tracking-tight">
            Unternehmen registrieren
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
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
          <TextField label="Rechtsform" value={form.legalForm} onChange={(e) => updateField("legalForm", e.target.value)} />
          <TextField label="Steuernummer" value={form.taxNumber} onChange={(e) => updateField("taxNumber", e.target.value)} />
          <TextField label="USt-ID" value={form.vatId} onChange={(e) => updateField("vatId", e.target.value)} />
          <SelectField label="Umsatzsteuer befreit" value={form.vatExempt} onChange={(e) => updateField("vatExempt", e.target.value)}>
            <option value="no">Nein</option>
            <option value="yes">Ja</option>
          </SelectField>
          <TextField label="Stadt" value={form.city} onChange={(e) => updateField("city", e.target.value)} />
          <TextField label="Land" value={form.country} onChange={(e) => updateField("country", e.target.value)} />
        </div>

        <TextAreaField
          label="Beschreibung"
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
        />

        <FileUploadField
          accept="image/*"
          files={logo}
          label="Logo"
          multiple={false}
          onChange={(selectedFiles) => setLogo(selectedFiles?.[0] ?? null)}
        />

        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

        <button
          className="premium-button rounded-lg px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:bg-zinc-400"
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Erstelle Account..." : "Unternehmen Account erstellen"}
        </button>
      </form>
    </main>
  );
}
