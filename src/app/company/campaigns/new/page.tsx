"use client";

import { addDoc, collection, doc, increment, serverTimestamp, updateDoc } from "firebase/firestore";
import { FormEvent, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { ProtectedPage } from "@/components/auth/protected-page";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SelectField, TextAreaField, TextField } from "@/components/ui/form-field";
import { db } from "@/lib/firebase";
import { campaignFormats, campaignGoals, creatorCategories, socialPlatforms } from "@/lib/profile-options";
import { uploadProfileFiles } from "@/lib/storage-upload";
import type { CampaignStatus, CompensationType, Gender, SocialPlatform } from "@/types/creatorflow";

const initialForm = {
  title: "",
  productName: "",
  productDescription: "",
  productValue: "",
  feeMin: "",
  feeMax: "",
  compensationType: "fixed" as CompensationType,
  includesProductPackage: "no",
  format: "",
  goal: "",
  targetAudience: "",
  category: "",
  creatorCount: "",
  applicationDeadline: "",
  contentDeadline: "",
  publishDate: "",
  hashtags: "",
  links: "",
  discountCode: "",
  dos: "",
  donts: "",
  briefing: "",
  usageRights: "",
  adUsage: "no",
  whitelisting: "no",
  exclusivity: "no",
  productShipping: "no",
  shippingInfo: "",
  status: "active" as CampaignStatus,
  matchFollowerMin: "",
  matchFollowerMax: "",
  matchCountry: "",
  matchLanguage: "",
  matchEngagementMin: "",
  matchGender: "" as Gender | "",
};

function toNumber(value: string) {
  return Number(value.replace(",", ".")) || 0;
}

function lines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function NewCampaignPage() {
  const { appUser } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([]);
  const [productImages, setProductImages] = useState<FileList | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function togglePlatform(platform: SocialPlatform) {
    setPlatforms((current) =>
      current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!appUser) return;

    setSaving(true);
    setMessage("");

    const campaignRef = await addDoc(collection(db, "campaigns"), {
      companyId: appUser.uid,
      companyName: appUser.displayName,
      title: form.title,
      productName: form.productName,
      productDescription: form.productDescription,
      productImages: [],
      productValue: toNumber(form.productValue),
      feeMin: toNumber(form.feeMin),
      feeMax: toNumber(form.feeMax),
      compensationType: form.compensationType,
      includesProductPackage: form.includesProductPackage === "yes",
      platforms,
      format: form.format,
      goal: form.goal,
      targetAudience: form.targetAudience,
      category: form.category,
      creatorCount: toNumber(form.creatorCount),
      applicationDeadline: form.applicationDeadline,
      contentDeadline: form.contentDeadline,
      publishDate: form.publishDate,
      hashtags: lines(form.hashtags),
      links: lines(form.links),
      discountCode: form.discountCode,
      dos: form.dos,
      donts: form.donts,
      briefing: form.briefing,
      files: [],
      usageRights: form.usageRights,
      adUsage: form.adUsage === "yes",
      whitelisting: form.whitelisting === "yes",
      exclusivity: form.exclusivity === "yes",
      productShipping: form.productShipping === "yes",
      shippingInfo: form.shippingInfo,
      status: form.status,
      matchFollowerMin: toNumber(form.matchFollowerMin),
      matchFollowerMax: toNumber(form.matchFollowerMax),
      matchCountry: form.matchCountry,
      matchLanguage: form.matchLanguage,
      matchEngagementMin: toNumber(form.matchEngagementMin),
      matchGender: form.matchGender,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const [uploadedImages, uploadedFiles] = await Promise.all([
      uploadProfileFiles(productImages, `campaigns/${campaignRef.id}/product-images`),
      uploadProfileFiles(files, `campaigns/${campaignRef.id}/files`),
    ]);

    await updateDoc(campaignRef, {
      id: campaignRef.id,
      productImages: uploadedImages,
      files: uploadedFiles,
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "companyProfiles", appUser.uid), {
      activeCampaigns: increment(form.status === "active" ? 1 : 0),
      budgetMin: toNumber(form.feeMin),
      budgetMax: toNumber(form.feeMax),
      updatedAt: serverTimestamp(),
    });

    setForm(initialForm);
    setPlatforms([]);
    setProductImages(null);
    setFiles(null);
    setMessage("Kampagne wurde erstellt.");
    setSaving(false);
  }

  return (
    <ProtectedPage role="company">
      <DashboardShell title="Neue Kampagne erstellen">
        <form className="grid gap-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Titel" required value={form.title} onChange={(e) => updateField("title", e.target.value)} />
            <TextField label="Produktname" value={form.productName} onChange={(e) => updateField("productName", e.target.value)} />
            <TextField label="Produktwert" inputMode="decimal" value={form.productValue} onChange={(e) => updateField("productValue", e.target.value)} />
            <TextField label="Gage Minimum" inputMode="decimal" value={form.feeMin} onChange={(e) => updateField("feeMin", e.target.value)} />
            <TextField label="Gage Maximum" inputMode="decimal" value={form.feeMax} onChange={(e) => updateField("feeMax", e.target.value)} />
            <SelectField label="Fixe Gage oder verhandelbar" value={form.compensationType} onChange={(e) => updateField("compensationType", e.target.value)}>
              <option value="fixed">Fixe Gage</option>
              <option value="negotiable">Verhandelbar</option>
            </SelectField>
            <SelectField label="Produktpaket" value={form.includesProductPackage} onChange={(e) => updateField("includesProductPackage", e.target.value)}>
              <option value="no">Nein</option>
              <option value="yes">Ja</option>
            </SelectField>
            <SelectField label="Format" value={form.format} onChange={(e) => updateField("format", e.target.value)}>
              <option value="">Bitte waehlen</option>
              {campaignFormats.map((format) => <option key={format} value={format}>{format}</option>)}
            </SelectField>
            <SelectField label="Ziel" value={form.goal} onChange={(e) => updateField("goal", e.target.value)}>
              <option value="">Bitte waehlen</option>
              {campaignGoals.map((goal) => <option key={goal} value={goal}>{goal}</option>)}
            </SelectField>
            <SelectField label="Kategorie" value={form.category} onChange={(e) => updateField("category", e.target.value)}>
              <option value="">Bitte waehlen</option>
              {creatorCategories.map((category) => <option key={category} value={category}>{category}</option>)}
            </SelectField>
            <TextField label="Benoetigte Creator Anzahl" inputMode="numeric" value={form.creatorCount} onChange={(e) => updateField("creatorCount", e.target.value)} />
            <TextField label="Bewerbungsfrist" type="date" value={form.applicationDeadline} onChange={(e) => updateField("applicationDeadline", e.target.value)} />
            <TextField label="Content Deadline" type="date" value={form.contentDeadline} onChange={(e) => updateField("contentDeadline", e.target.value)} />
            <TextField label="Veroeffentlichungsdatum" type="date" value={form.publishDate} onChange={(e) => updateField("publishDate", e.target.value)} />
            <TextField label="Rabattcode" value={form.discountCode} onChange={(e) => updateField("discountCode", e.target.value)} />
            <SelectField label="Status" value={form.status} onChange={(e) => updateField("status", e.target.value)}>
              <option value="draft">Entwurf</option>
              <option value="active">Aktiv</option>
              <option value="closed">Geschlossen</option>
            </SelectField>
          </div>

          <fieldset className="grid gap-3">
            <legend className="text-sm font-medium text-zinc-700">Plattform</legend>
            <div className="flex flex-wrap gap-2">
              {socialPlatforms.map((platform) => (
                <button className={`rounded-full border px-3 py-2 text-sm font-medium ${platforms.includes(platform) ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-300 bg-white text-zinc-700"}`} key={platform} onClick={() => togglePlatform(platform)} type="button">
                  {platform}
                </button>
              ))}
            </div>
          </fieldset>

          <TextAreaField label="Produktbeschreibung" value={form.productDescription} onChange={(e) => updateField("productDescription", e.target.value)} />
          <TextAreaField label="Zielgruppe" value={form.targetAudience} onChange={(e) => updateField("targetAudience", e.target.value)} />
          <TextAreaField label="Hashtags" placeholder="Ein Hashtag pro Zeile" value={form.hashtags} onChange={(e) => updateField("hashtags", e.target.value)} />
          <TextAreaField label="Links" placeholder="Ein Link pro Zeile" value={form.links} onChange={(e) => updateField("links", e.target.value)} />
          <TextAreaField label="Do's" value={form.dos} onChange={(e) => updateField("dos", e.target.value)} />
          <TextAreaField label="Don'ts" value={form.donts} onChange={(e) => updateField("donts", e.target.value)} />
          <TextAreaField label="Briefing" value={form.briefing} onChange={(e) => updateField("briefing", e.target.value)} />
          <TextAreaField label="Nutzungsrechte" value={form.usageRights} onChange={(e) => updateField("usageRights", e.target.value)} />
          <TextAreaField label="Versandinformationen" value={form.shippingInfo} onChange={(e) => updateField("shippingInfo", e.target.value)} />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SelectField label="Ad-Nutzung" value={form.adUsage} onChange={(e) => updateField("adUsage", e.target.value)}><option value="no">Nein</option><option value="yes">Ja</option></SelectField>
            <SelectField label="Whitelisting" value={form.whitelisting} onChange={(e) => updateField("whitelisting", e.target.value)}><option value="no">Nein</option><option value="yes">Ja</option></SelectField>
            <SelectField label="Exklusivitaet" value={form.exclusivity} onChange={(e) => updateField("exclusivity", e.target.value)}><option value="no">Nein</option><option value="yes">Ja</option></SelectField>
            <SelectField label="Produktversand" value={form.productShipping} onChange={(e) => updateField("productShipping", e.target.value)}><option value="no">Nein</option><option value="yes">Ja</option></SelectField>
          </div>

          <section className="grid gap-4 rounded-lg border border-zinc-200 p-4">
            <h2 className="text-lg font-semibold">Matching-Regeln</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <TextField label="Follower Minimum" inputMode="numeric" value={form.matchFollowerMin} onChange={(e) => updateField("matchFollowerMin", e.target.value)} />
              <TextField label="Follower Maximum" inputMode="numeric" value={form.matchFollowerMax} onChange={(e) => updateField("matchFollowerMax", e.target.value)} />
              <TextField label="Land" value={form.matchCountry} onChange={(e) => updateField("matchCountry", e.target.value)} />
              <TextField label="Sprache" value={form.matchLanguage} onChange={(e) => updateField("matchLanguage", e.target.value)} />
              <TextField label="Engagement Minimum" inputMode="decimal" value={form.matchEngagementMin} onChange={(e) => updateField("matchEngagementMin", e.target.value)} />
              <SelectField label="Geschlecht" value={form.matchGender} onChange={(e) => updateField("matchGender", e.target.value)}>
                <option value="">Egal</option>
                <option value="male">Maennlich</option>
                <option value="female">Weiblich</option>
                <option value="diverse">Divers</option>
                <option value="not_specified">Keine Angabe</option>
              </SelectField>
            </div>
          </section>

          <label className="grid gap-2 text-sm font-medium text-zinc-700">Produktbilder<input accept="image/*" multiple onChange={(e) => setProductImages(e.target.files)} type="file" /></label>
          <label className="grid gap-2 text-sm font-medium text-zinc-700">Dateien<input multiple onChange={(e) => setFiles(e.target.files)} type="file" /></label>

          {message ? <p className="text-sm font-medium text-green-700">{message}</p> : null}
          <button className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white disabled:bg-zinc-400" disabled={saving} type="submit">
            {saving ? "Erstellt..." : "Kampagne erstellen"}
          </button>
        </form>
      </DashboardShell>
    </ProtectedPage>
  );
}
