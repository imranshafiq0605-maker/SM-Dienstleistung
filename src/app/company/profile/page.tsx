"use client";

import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { FormEvent, useEffect, useState } from "react";
import { ProtectedPage } from "@/components/auth/protected-page";
import { useAuth } from "@/components/auth/auth-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { FileUploadField, SelectField, TextAreaField, TextField } from "@/components/ui/form-field";
import { db } from "@/lib/firebase";
import { uploadProfileFile } from "@/lib/storage-upload";
import type { CompanyProfile } from "@/types/creatorflow";

const initialForm = {
  companyName: "",
  contactPerson: "",
  phone: "",
  website: "",
  industry: "",
  description: "",
  address: "",
  billingAddress: "",
  vatId: "",
  legalForm: "",
  taxNumber: "",
  vatExempt: "no",
  country: "",
  city: "",
  socialLinks: "",
};

export default function CompanyProfilePage() {
  const { appUser } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [logo, setLogo] = useState<File | null>(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!appUser) return;

    getDoc(doc(db, "companyProfiles", appUser.uid)).then((snapshot) => {
      if (!snapshot.exists()) return;

      const profile = snapshot.data() as CompanyProfile;
      setForm({
        companyName: profile.companyName ?? "",
        contactPerson: profile.contactPerson ?? "",
        phone: profile.phone ?? "",
        website: profile.website ?? "",
        industry: profile.industry ?? "",
        description: profile.description ?? "",
        address: profile.address ?? "",
        billingAddress: profile.billingAddress ?? "",
        vatId: profile.vatId ?? "",
        legalForm: profile.legalForm ?? "",
        taxNumber: profile.taxNumber ?? "",
        vatExempt: profile.vatExempt ? "yes" : "no",
        country: profile.country ?? "",
        city: profile.city ?? "",
        socialLinks: (profile.socialLinks ?? []).join("\n"),
      });
      setCurrentLogoUrl(profile.logoUrl ?? null);
    });
  }, [appUser]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!appUser) return;

    setSaving(true);
    setMessage("");

    let logoUrl = currentLogoUrl;

    if (logo) {
      const uploaded = await uploadProfileFile(
        logo,
        `companyProfiles/${appUser.uid}/logo`,
      );
      logoUrl = uploaded.url;
    }

    const socialLinks = form.socialLinks
      .split("\n")
      .map((link) => link.trim())
      .filter(Boolean);

    await updateDoc(doc(db, "companyProfiles", appUser.uid), {
      companyName: form.companyName,
      contactPerson: form.contactPerson,
      phone: form.phone,
      website: form.website,
      industry: form.industry,
      description: form.description,
      address: form.address,
      billingAddress: form.billingAddress,
      vatId: form.vatId,
      legalForm: form.legalForm,
      taxNumber: form.taxNumber,
      vatExempt: form.vatExempt === "yes",
      country: form.country,
      city: form.city,
      socialLinks,
      logoUrl,
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "users", appUser.uid), {
      displayName: form.companyName,
      updatedAt: serverTimestamp(),
    });

    setCurrentLogoUrl(logoUrl);
    setLogo(null);
    setMessage("Unternehmensprofil gespeichert.");
    setSaving(false);
  }

  return (
    <ProtectedPage role="company">
      <DashboardShell title="Unternehmensprofil bearbeiten">
        <form
          className="grid gap-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Firmenname" value={form.companyName} onChange={(e) => updateField("companyName", e.target.value)} />
            <TextField label="Ansprechpartner" value={form.contactPerson} onChange={(e) => updateField("contactPerson", e.target.value)} />
            <TextField label="Telefon" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
            <TextField label="Website" value={form.website} onChange={(e) => updateField("website", e.target.value)} />
            <TextField label="Branche" value={form.industry} onChange={(e) => updateField("industry", e.target.value)} />
            <TextField label="USt-ID" value={form.vatId} onChange={(e) => updateField("vatId", e.target.value)} />
            <TextField label="Rechtsform" placeholder="z. B. GmbH, UG, Einzelunternehmen" value={form.legalForm} onChange={(e) => updateField("legalForm", e.target.value)} />
            <TextField label="Steuernummer" value={form.taxNumber} onChange={(e) => updateField("taxNumber", e.target.value)} />
            <SelectField label="Umsatzsteuer befreit" value={form.vatExempt} onChange={(e) => updateField("vatExempt", e.target.value)}>
              <option value="no">Nein</option>
              <option value="yes">Ja</option>
            </SelectField>
            <TextField label="Land" value={form.country} onChange={(e) => updateField("country", e.target.value)} />
            <TextField label="Stadt" value={form.city} onChange={(e) => updateField("city", e.target.value)} />
          </div>

          <TextAreaField label="Beschreibung" value={form.description} onChange={(e) => updateField("description", e.target.value)} />
          <TextAreaField label="Adresse" value={form.address} onChange={(e) => updateField("address", e.target.value)} />
          <TextAreaField label="Rechnungsadresse" value={form.billingAddress} onChange={(e) => updateField("billingAddress", e.target.value)} />
          <TextAreaField
            label="Social Media Links"
            placeholder="Ein Link pro Zeile"
            value={form.socialLinks}
            onChange={(e) => updateField("socialLinks", e.target.value)}
          />

          <FileUploadField
            accept="image/*"
            files={logo}
            label="Logo"
            multiple={false}
            onChange={(selectedFiles) => setLogo(selectedFiles?.[0] ?? null)}
          />
          {currentLogoUrl ? (
            <a className="text-sm font-medium text-zinc-700 underline" href={currentLogoUrl} rel="noreferrer" target="_blank">
              Aktuelles Logo ansehen
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
