"use client";

import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { FormEvent, useEffect, useState } from "react";
import { ProtectedPage } from "@/components/auth/protected-page";
import { useAuth } from "@/components/auth/auth-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SelectField, TextField } from "@/components/ui/form-field";
import { db } from "@/lib/firebase";
import { socialPlatforms } from "@/lib/profile-options";
import type { CreatorProfile, SocialAccount, SocialPlatform } from "@/types/creatorflow";

const initialSocial = {
  platform: "TikTok" as SocialPlatform,
  username: "",
  profileUrl: "",
  followers: "",
  averageViews: "",
  engagementRate: "",
  audienceAge: "",
  audienceCountry: "",
};

function toNumber(value: string) {
  return Number(value.replace(",", ".")) || 0;
}

export default function CreatorSocialsPage() {
  const { appUser } = useAuth();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [form, setForm] = useState(initialSocial);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!appUser) return;

    getDoc(doc(db, "creatorProfiles", appUser.uid)).then((snapshot) => {
      if (!snapshot.exists()) return;

      const profile = snapshot.data() as CreatorProfile;
      setAccounts(profile.socialAccounts ?? []);
    });
  }, [appUser]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function persist(nextAccounts: SocialAccount[]) {
    if (!appUser) return;

    await updateDoc(doc(db, "creatorProfiles", appUser.uid), {
      socialAccounts: nextAccounts,
      updatedAt: serverTimestamp(),
    });
    setAccounts(nextAccounts);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextAccount: SocialAccount = {
      id: crypto.randomUUID(),
      platform: form.platform,
      username: form.username,
      profileUrl: form.profileUrl,
      followers: toNumber(form.followers),
      averageViews: toNumber(form.averageViews),
      engagementRate: toNumber(form.engagementRate),
      audienceAge: form.audienceAge,
      audienceCountry: form.audienceCountry,
    };

    await persist([...accounts, nextAccount]);
    setForm(initialSocial);
    setMessage("Social Account gespeichert.");
  }

  async function removeAccount(id: string) {
    const nextAccounts = accounts.filter((account) => account.id !== id);
    await persist(nextAccounts);
    setMessage("Social Account entfernt.");
  }

  return (
    <ProtectedPage role="creator">
      <DashboardShell title="Social Accounts">
        <form
          className="grid gap-5 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
          onSubmit={handleSubmit}
        >
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Neuer Account
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Plattformdaten erfassen
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Plattform" value={form.platform} onChange={(e) => updateField("platform", e.target.value)}>
              {socialPlatforms.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </SelectField>
            <TextField label="Username" required value={form.username} onChange={(e) => updateField("username", e.target.value)} />
            <TextField label="Profil-Link" value={form.profileUrl} onChange={(e) => updateField("profileUrl", e.target.value)} />
            <TextField label="Follower" inputMode="numeric" value={form.followers} onChange={(e) => updateField("followers", e.target.value)} />
            <TextField label="Durchschnittliche Views" inputMode="numeric" value={form.averageViews} onChange={(e) => updateField("averageViews", e.target.value)} />
            <TextField label="Engagement Rate" inputMode="decimal" value={form.engagementRate} onChange={(e) => updateField("engagementRate", e.target.value)} />
            <TextField label="Zielgruppenalter" value={form.audienceAge} onChange={(e) => updateField("audienceAge", e.target.value)} />
            <TextField label="Hauptland" value={form.audienceCountry} onChange={(e) => updateField("audienceCountry", e.target.value)} />
          </div>

          {message ? <p className="text-sm font-medium text-green-700">{message}</p> : null}
          <button className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white" type="submit">
            Social Account hinzufuegen
          </button>
        </form>

        <section className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Gespeicherte Accounts</h2>
          {accounts.length === 0 ? (
            <p className="text-sm text-zinc-500">Noch keine Accounts gespeichert.</p>
          ) : null}
          {accounts.map((account) => (
            <article className="grid gap-3 rounded-lg border border-zinc-200 p-4 sm:grid-cols-[1fr_auto] sm:items-center" key={account.id}>
              <div>
                <p className="font-semibold">
                  {account.platform} · @{account.username}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  {account.followers.toLocaleString("de-DE")} Follower · {account.averageViews.toLocaleString("de-DE")} Views · {account.engagementRate}% ER
                </p>
                {account.profileUrl ? (
                  <a className="mt-2 inline-block text-sm font-medium text-zinc-700 underline" href={account.profileUrl} rel="noreferrer" target="_blank">
                    Profil oeffnen
                  </a>
                ) : null}
              </div>
              <button className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800" onClick={() => void removeAccount(account.id)} type="button">
                Entfernen
              </button>
            </article>
          ))}
        </section>
      </DashboardShell>
    </ProtectedPage>
  );
}
