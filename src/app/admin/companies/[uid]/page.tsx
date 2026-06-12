"use client";

import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminSection, StatusBadge } from "@/components/admin/admin-ui";
import { SelectField, TextAreaField, TextField } from "@/components/ui/form-field";
import { adminUserRequest } from "@/lib/admin-client";
import { db } from "@/lib/firebase";
import type { CompanyProfile, UserStatus } from "@/types/creatorflow";

const emptyCompany: CompanyProfile = {
  address: "",
  billingAddress: "",
  city: "",
  companyName: "",
  contactPerson: "",
  country: "",
  createdAt: null,
  description: "",
  email: "",
  industry: "",
  logoUrl: null,
  phone: "",
  socialLinks: [],
  status: "pending",
  uid: "",
  vatId: "",
  verified: false,
  website: "",
};

function formatJson(value: unknown) {
  return JSON.stringify(value ?? [], null, 2);
}

function parseJsonArray(value: string, fallback: string[]) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : fallback;
  } catch {
    return fallback;
  }
}

export default function AdminCompanyDetailPage() {
  const params = useParams<{ uid: string }>();
  const router = useRouter();
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authDisabled, setAuthDisabled] = useState(false);
  const [socialLinksJson, setSocialLinksJson] = useState("[]");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    getDoc(doc(db, "companyProfiles", params.uid)).then((snapshot) => {
      if (!mounted) return;

      const loaded = snapshot.exists()
        ? { ...emptyCompany, ...(snapshot.data() as CompanyProfile), uid: params.uid }
        : { ...emptyCompany, uid: params.uid };

      setCompany(loaded);
      setAuthEmail(loaded.email);
      setSocialLinksJson(formatJson(loaded.socialLinks));
    });

    return () => {
      mounted = false;
    };
  }, [params.uid]);

  function updateField<K extends keyof CompanyProfile>(
    key: K,
    value: CompanyProfile[K],
  ) {
    setCompany((current) => (current ? { ...current, [key]: value } : current));
  }

  function updateNumberField(key: keyof CompanyProfile, value: string) {
    setCompany((current) =>
      current ? { ...current, [key]: Number(value || 0) } : current,
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!company) return;

    setSaving(true);
    setSaved(false);
    setError("");

    const socialLinks = parseJsonArray(socialLinksJson, company.socialLinks);

    try {
      await adminUserRequest(company.uid, {
        body: JSON.stringify({
          auth: {
            disabled: authDisabled,
            displayName: company.companyName,
            email: authEmail,
            password: authPassword,
          },
          companyProfile: {
            activeCampaigns: Number(company.activeCampaigns || 0),
            address: company.address,
            billingAddress: company.billingAddress,
            budgetMax: Number(company.budgetMax || 0),
            budgetMin: Number(company.budgetMin || 0),
            city: company.city,
            companyName: company.companyName,
            contactPerson: company.contactPerson,
            country: company.country,
            description: company.description,
            email: authEmail,
            industry: company.industry,
            logoUrl: company.logoUrl || null,
            phone: company.phone,
            socialLinks,
            status: company.status,
            vatId: company.vatId,
            verified: Boolean(company.verified),
            website: company.website,
          },
          customClaims: {
            role: "company",
            status: company.status,
          },
          user: {
            displayName: company.companyName,
            email: authEmail,
            role: "company",
            status: company.status,
          },
        }),
        method: "PATCH",
      });

      setCompany((current) =>
        current ? { ...current, email: authEmail, socialLinks } : current,
      );
      setAuthPassword("");
      setSaved(true);
    } catch (adminError) {
      setError(
        adminError instanceof Error
          ? adminError.message
          : "Admin-Speicherung fehlgeschlagen.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteCompany() {
    if (!company) return;

    const confirmed = window.confirm(
      "Unternehmen wirklich löschen? Auth-Account und Firestore-Profile werden entfernt.",
    );
    if (!confirmed) return;

    setSaving(true);
    setError("");

    try {
      await adminUserRequest(company.uid, { method: "DELETE" });
      router.push("/admin/companies");
    } catch (adminError) {
      setError(
        adminError instanceof Error
          ? adminError.message
          : "Löschen fehlgeschlagen.",
      );
      setSaving(false);
    }
  }

  return (
    <AdminShell
      subtitle="Bearbeite Unternehmen vollständig: Auth-Zugang, Verifizierung, Stammdaten, Rechnungsdaten, Budget und Social Links."
      title="Unternehmen komplett bearbeiten"
    >
      {!company ? (
        <AdminSection title="Profil wird geladen">
          <p className="text-sm text-zinc-500">Unternehmen wird geladen...</p>
        </AdminSection>
      ) : (
        <form className="grid gap-6" onSubmit={handleSubmit}>
          <AdminSection
            action={<StatusBadge status={company.status} />}
            eyebrow="Unternehmensprofil"
            title={company.companyName || "Unternehmen"}
          >
            <div className="grid gap-4 md:grid-cols-3">
              <TextField label="Firmenname" onChange={(e) => updateField("companyName", e.target.value)} value={company.companyName} />
              <TextField label="Ansprechpartner" onChange={(e) => updateField("contactPerson", e.target.value)} value={company.contactPerson} />
              <TextField label="Profil-E-Mail" onChange={(e) => updateField("email", e.target.value)} type="email" value={company.email} />
              <TextField label="Telefon" onChange={(e) => updateField("phone", e.target.value)} value={company.phone} />
              <TextField label="Website" onChange={(e) => updateField("website", e.target.value)} value={company.website} />
              <TextField label="Branche" onChange={(e) => updateField("industry", e.target.value)} value={company.industry} />
              <TextField label="Logo URL" onChange={(e) => updateField("logoUrl", e.target.value || null)} value={company.logoUrl || ""} />
              <TextField label="USt-ID" onChange={(e) => updateField("vatId", e.target.value)} value={company.vatId} />
              <SelectField label="Status" onChange={(e) => updateField("status", e.target.value as UserStatus)} value={company.status}>
                <option value="pending">Wartet</option>
                <option value="active">Aktiv</option>
                <option value="rejected">Gesperrt</option>
              </SelectField>
              <TextField label="Stadt" onChange={(e) => updateField("city", e.target.value)} value={company.city} />
              <TextField label="Land" onChange={(e) => updateField("country", e.target.value)} value={company.country} />
              <TextField label="Aktive Kampagnen" min={0} onChange={(e) => updateNumberField("activeCampaigns", e.target.value)} type="number" value={String(company.activeCampaigns || 0)} />
              <TextField label="Budget Minimum" min={0} onChange={(e) => updateNumberField("budgetMin", e.target.value)} type="number" value={String(company.budgetMin || 0)} />
              <TextField label="Budget Maximum" min={0} onChange={(e) => updateNumberField("budgetMax", e.target.value)} type="number" value={String(company.budgetMax || 0)} />
              <label className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white/80 p-4 text-sm font-semibold text-zinc-700">
                <input checked={Boolean(company.verified)} onChange={(e) => updateField("verified", e.target.checked)} type="checkbox" />
                Unternehmen verifiziert
              </label>
            </div>
            <div className="mt-4 grid gap-4">
              <TextAreaField label="Beschreibung" onChange={(e) => updateField("description", e.target.value)} value={company.description} />
              <TextAreaField label="Adresse" onChange={(e) => updateField("address", e.target.value)} value={company.address} />
              <TextAreaField label="Rechnungsadresse" onChange={(e) => updateField("billingAddress", e.target.value)} value={company.billingAddress} />
            </div>
          </AdminSection>

          <AdminSection eyebrow="Firebase Auth" title="Login-Daten und Account-Zugriff">
            <div className="grid gap-4 md:grid-cols-3">
              <TextField label="Login-E-Mail" onChange={(e) => setAuthEmail(e.target.value)} type="email" value={authEmail} />
              <TextField label="Neues Passwort" minLength={6} onChange={(e) => setAuthPassword(e.target.value)} placeholder="Leer lassen, wenn unverändert" type="password" value={authPassword} />
              <label className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white/80 p-4 text-sm font-semibold text-zinc-700">
                <input checked={authDisabled} onChange={(e) => setAuthDisabled(e.target.checked)} type="checkbox" />
                Auth-Account deaktivieren
              </label>
            </div>
          </AdminSection>

          <AdminSection eyebrow="Social Media" title="Social Links bearbeiten">
            <TextAreaField label="Social Links JSON" onChange={(e) => setSocialLinksJson(e.target.value)} value={socialLinksJson} />
          </AdminSection>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button className="premium-button rounded-lg px-5 py-3 text-sm font-black disabled:opacity-50" disabled={saving} type="submit">
              {saving ? "Speichert..." : "Alles speichern"}
            </button>
            <Link className="premium-button-secondary rounded-lg px-5 py-3 text-center text-sm font-black" href="/admin/companies">
              Zurück zu Unternehmen
            </Link>
            {saved ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                Gespeichert.
              </p>
            ) : null}
            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </p>
            ) : null}
            <button
              className="rounded-lg border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700 disabled:opacity-50"
              disabled={saving}
              onClick={() => void deleteCompany()}
              type="button"
            >
              Unternehmen löschen
            </button>
          </div>
        </form>
      )}
    </AdminShell>
  );
}
