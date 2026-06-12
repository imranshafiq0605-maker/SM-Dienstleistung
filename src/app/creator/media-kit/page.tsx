"use client";

import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { ProtectedPage } from "@/components/auth/protected-page";
import { useAuth } from "@/components/auth/auth-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { db } from "@/lib/firebase";
import { uploadProfileFiles } from "@/lib/storage-upload";
import type { CreatorProfile, UploadedAsset } from "@/types/creatorflow";

type AssetGroup = "mediaKit" | "screenshots" | "portfolio";

const groupLabels: Record<AssetGroup, string> = {
  mediaKit: "Media Kit",
  screenshots: "Screenshots",
  portfolio: "Portfolio",
};

export default function CreatorMediaKitPage() {
  const { appUser } = useAuth();
  const [assets, setAssets] = useState<Record<AssetGroup, UploadedAsset[]>>({
    mediaKit: [],
    screenshots: [],
    portfolio: [],
  });
  const [selectedFiles, setSelectedFiles] = useState<
    Record<AssetGroup, FileList | null>
  >({
    mediaKit: null,
    screenshots: null,
    portfolio: null,
  });
  const [savingGroup, setSavingGroup] = useState<AssetGroup | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!appUser) return;

    getDoc(doc(db, "creatorProfiles", appUser.uid)).then((snapshot) => {
      if (!snapshot.exists()) return;

      const profile = snapshot.data() as CreatorProfile;
      setAssets({
        mediaKit: profile.mediaKit ?? [],
        screenshots: profile.screenshots ?? [],
        portfolio: profile.portfolio ?? [],
      });
    });
  }, [appUser]);

  function selectFiles(group: AssetGroup, event: ChangeEvent<HTMLInputElement>) {
    setSelectedFiles((current) => ({
      ...current,
      [group]: event.target.files,
    }));
  }

  async function uploadGroup(group: AssetGroup, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!appUser) return;

    setSavingGroup(group);
    setMessage("");

    const uploaded = await uploadProfileFiles(
      selectedFiles[group],
      `creatorProfiles/${appUser.uid}/${group}`,
    );
    const nextAssets = [...assets[group], ...uploaded];

    await updateDoc(doc(db, "creatorProfiles", appUser.uid), {
      [group]: nextAssets,
      updatedAt: serverTimestamp(),
    });

    setAssets((current) => ({ ...current, [group]: nextAssets }));
    setSelectedFiles((current) => ({ ...current, [group]: null }));
    setMessage(`${groupLabels[group]} gespeichert.`);
    setSavingGroup(null);
  }

  async function removeAsset(group: AssetGroup, assetPath: string) {
    if (!appUser) return;

    const nextAssets = assets[group].filter((asset) => asset.path !== assetPath);
    await updateDoc(doc(db, "creatorProfiles", appUser.uid), {
      [group]: nextAssets,
      updatedAt: serverTimestamp(),
    });
    setAssets((current) => ({ ...current, [group]: nextAssets }));
    setMessage("Datei aus dem Profil entfernt.");
  }

  return (
    <ProtectedPage role="creator">
      <DashboardShell title="Media Kit und Dateien">
        <div className="grid gap-5">
          {(Object.keys(groupLabels) as AssetGroup[]).map((group) => (
            <section
              className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
              key={group}
            >
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
                  Upload
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  {groupLabels[group]}
                </h2>
              </div>

              <form className="grid gap-3" onSubmit={(event) => void uploadGroup(group, event)}>
                <input
                  multiple
                  onChange={(event) => selectFiles(group, event)}
                  type="file"
                />
                <button
                  className="w-fit rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white disabled:bg-zinc-400"
                  disabled={savingGroup === group}
                  type="submit"
                >
                  {savingGroup === group ? "Laedt hoch..." : `${groupLabels[group]} hochladen`}
                </button>
              </form>

              <div className="grid gap-2">
                {assets[group].length === 0 ? (
                  <p className="text-sm text-zinc-500">Noch keine Dateien gespeichert.</p>
                ) : null}
                {assets[group].map((asset) => (
                  <article
                    className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                    key={asset.path}
                  >
                    <a className="text-sm font-medium text-zinc-800 underline" href={asset.url} rel="noreferrer" target="_blank">
                      {asset.name}
                    </a>
                    <button
                      className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold"
                      onClick={() => void removeAsset(group, asset.path)}
                      type="button"
                    >
                      Entfernen
                    </button>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        {message ? (
          <p className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
            {message}
          </p>
        ) : null}
      </DashboardShell>
    </ProtectedPage>
  );
}
