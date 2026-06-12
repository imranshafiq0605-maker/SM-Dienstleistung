"use client";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { FormEvent, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { SelectField, TextAreaField, TextField } from "@/components/ui/form-field";
import { db } from "@/lib/firebase";
import { campaignFormats, socialPlatforms } from "@/lib/profile-options";
import { uploadProfileFiles } from "@/lib/storage-upload";
import type { OfferDirection, SocialPlatform } from "@/types/creatorflow";

const initialForm = {
  recipientId: "",
  recipientName: "",
  price: "",
  service: "",
  platform: "" as SocialPlatform | "",
  format: "",
  deadline: "",
  usageRights: "",
  whitelisting: "no",
  revisions: "",
  productShipping: "no",
  briefing: "",
  paymentTerms: "",
  cancellationRules: "",
  message: "",
};

export function OfferForm({ direction }: { direction: OfferDirection }) {
  const { appUser } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState<FileList | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!appUser) return;

    setSaving(true);
    setMessage("");

    const uploadedFiles = await uploadProfileFiles(
      files,
      `offers/${appUser.uid}/${Date.now()}`,
    );
    const isCompanyToCreator = direction === "company_to_creator";

    await addDoc(collection(db, "offers"), {
      direction,
      senderId: appUser.uid,
      senderName: appUser.displayName,
      recipientId: form.recipientId,
      recipientName: form.recipientName,
      creatorId: isCompanyToCreator ? form.recipientId : appUser.uid,
      companyId: isCompanyToCreator ? appUser.uid : form.recipientId,
      price: Number(form.price.replace(",", ".")) || 0,
      service: form.service,
      platform: form.platform,
      format: form.format,
      deadline: form.deadline,
      usageRights: form.usageRights,
      whitelisting: form.whitelisting === "yes",
      revisions: Number(form.revisions) || 0,
      productShipping: form.productShipping === "yes",
      briefing: form.briefing,
      files: uploadedFiles,
      paymentTerms: form.paymentTerms,
      cancellationRules: form.cancellationRules,
      status: "sent",
      message: form.message,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    setForm(initialForm);
    setFiles(null);
    setMessage("Angebot wurde gesendet.");
    setSaving(false);
  }

  return (
    <form className="grid gap-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Direktes Angebot
        </p>
        <h2 className="mt-2 text-2xl font-semibold">
          {direction === "company_to_creator" ? "Creator Angebot senden" : "Kooperationsanfrage senden"}
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Fuer dieses MVP trage die Empfaenger-ID aus Firestore ein. Spaeter wird das direkt aus Profilkarten vorausgefuellt.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Empfaenger UID" required value={form.recipientId} onChange={(e) => updateField("recipientId", e.target.value)} />
        <TextField label="Empfaenger Name" value={form.recipientName} onChange={(e) => updateField("recipientName", e.target.value)} />
        <TextField label="Preis" inputMode="decimal" value={form.price} onChange={(e) => updateField("price", e.target.value)} />
        <TextField label="Leistung" value={form.service} onChange={(e) => updateField("service", e.target.value)} />
        <SelectField label="Plattform" value={form.platform} onChange={(e) => updateField("platform", e.target.value)}>
          <option value="">Bitte waehlen</option>
          {socialPlatforms.map((platform) => <option key={platform} value={platform}>{platform}</option>)}
        </SelectField>
        <SelectField label="Format" value={form.format} onChange={(e) => updateField("format", e.target.value)}>
          <option value="">Bitte waehlen</option>
          {campaignFormats.map((format) => <option key={format} value={format}>{format}</option>)}
        </SelectField>
        <TextField label="Deadline" type="date" value={form.deadline} onChange={(e) => updateField("deadline", e.target.value)} />
        <TextField label="Revisionen" inputMode="numeric" value={form.revisions} onChange={(e) => updateField("revisions", e.target.value)} />
        <SelectField label="Whitelisting" value={form.whitelisting} onChange={(e) => updateField("whitelisting", e.target.value)}><option value="no">Nein</option><option value="yes">Ja</option></SelectField>
        <SelectField label="Produktversand" value={form.productShipping} onChange={(e) => updateField("productShipping", e.target.value)}><option value="no">Nein</option><option value="yes">Ja</option></SelectField>
      </div>

      <TextAreaField label="Nutzungsrechte" value={form.usageRights} onChange={(e) => updateField("usageRights", e.target.value)} />
      <TextAreaField label="Briefing" value={form.briefing} onChange={(e) => updateField("briefing", e.target.value)} />
      <TextAreaField label="Zahlungsbedingungen" value={form.paymentTerms} onChange={(e) => updateField("paymentTerms", e.target.value)} />
      <TextAreaField label="Stornierungsregeln" value={form.cancellationRules} onChange={(e) => updateField("cancellationRules", e.target.value)} />
      <TextAreaField label="Nachricht" value={form.message} onChange={(e) => updateField("message", e.target.value)} />

      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        Dateien
        <input multiple onChange={(e) => setFiles(e.target.files)} type="file" />
      </label>

      {message ? <p className="text-sm font-medium text-green-700">{message}</p> : null}
      <button className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white disabled:bg-zinc-400" disabled={saving} type="submit">
        {saving ? "Sendet..." : "Senden"}
      </button>
    </form>
  );
}
