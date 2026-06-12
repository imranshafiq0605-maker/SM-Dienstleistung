"use client";

import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProtectedPage } from "@/components/auth/protected-page";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { db } from "@/lib/firebase";
import type { CreatorProfile } from "@/types/creatorflow";

function creatorName(profile: CreatorProfile) {
  return profile.artistName || `${profile.firstName} ${profile.lastName}`.trim();
}

function startPrice(profile: CreatorProfile) {
  const prices = [
    profile.minimumPrice,
    profile.priceStory,
    profile.priceReel,
    profile.priceTikTok,
    profile.priceYouTubeShort,
    profile.priceYouTubeVideo,
    profile.priceUgcVideo,
  ].filter((price) => typeof price === "number" && price > 0);

  return prices.length ? Math.min(...prices) : 0;
}

export default function CompanyCreatorProfilePage() {
  const params = useParams<{ uid: string }>();
  const [creator, setCreator] = useState<CreatorProfile | null>(null);

  useEffect(() => {
    getDoc(doc(db, "creatorProfiles", params.uid)).then((snapshot) => {
      setCreator(snapshot.exists() ? ({ ...(snapshot.data() as CreatorProfile), uid: params.uid }) : null);
    });
  }, [params.uid]);

  return (
    <ProtectedPage role="company">
      <DashboardShell title="Creator Profil">
        {!creator ? (
          <section className="premium-panel rounded-lg p-6 text-sm text-zinc-500">
            Creator wird geladen...
          </section>
        ) : (
          <section className="premium-panel overflow-hidden rounded-lg">
            <div className="grid lg:grid-cols-[360px_1fr]">
              <div className="min-h-[420px] bg-zinc-950">
                {creator.profileImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={creatorName(creator)} className="h-full w-full object-cover" src={creator.profileImageUrl} />
                ) : (
                  <div className="grid h-full place-items-center text-7xl font-black text-white">
                    {creatorName(creator).slice(0, 1)}
                  </div>
                )}
              </div>
              <div className="grid gap-6 p-6 sm:p-8">
                <div>
                  <p className="premium-kicker">Creator Profil</p>
                  <h1 className="mt-3 text-4xl font-black tracking-tight text-zinc-950">
                    {creatorName(creator)}
                  </h1>
                  <p className="mt-2 text-sm font-medium text-zinc-500">
                    {[creator.city, creator.country, creator.language].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <p className="text-base leading-8 text-zinc-600">
                  {creator.bio || creator.shortBio || "Keine Beschreibung hinterlegt."}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(creator.categories ?? []).map((category) => (
                    <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm font-bold text-zinc-700" key={category}>
                      {category}
                    </span>
                  ))}
                </div>
                <dl className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-white p-4"><dt className="text-sm text-zinc-500">Ab Preis</dt><dd className="mt-1 text-2xl font-black">{startPrice(creator).toLocaleString("de-DE")} €</dd></div>
                  <div className="rounded-lg bg-white p-4"><dt className="text-sm text-zinc-500">Bewertung</dt><dd className="mt-1 text-2xl font-black">{creator.rating ?? 0}/5</dd></div>
                  <div className="rounded-lg bg-white p-4"><dt className="text-sm text-zinc-500">Socials</dt><dd className="mt-1 text-2xl font-black">{creator.socialAccounts?.length ?? 0}</dd></div>
                </dl>
                <div className="flex flex-wrap gap-2">
                  <Link className="premium-button rounded-lg px-5 py-3 text-sm font-black" href={`/company/offers/new?recipientId=${creator.uid}&recipientName=${encodeURIComponent(creatorName(creator))}`}>
                    Angebot senden
                  </Link>
                  <Link className="premium-button-secondary rounded-lg px-5 py-3 text-sm font-black" href="/company/creator-search">
                    Zurück zur Suche
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </DashboardShell>
    </ProtectedPage>
  );
}
