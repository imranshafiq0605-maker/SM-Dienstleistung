"use client";

import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { ProtectedPage } from "@/components/auth/protected-page";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TextAreaField, TextField } from "@/components/ui/form-field";
import { db } from "@/lib/firebase";
import type { CampaignApplication } from "@/types/creatorflow";

const statusLabels: Record<CampaignApplication["status"], string> = {
  applied: "beworben",
  seen: "gesehen",
  in_review: "in Pruefung",
  accepted: "angenommen",
  rejected: "abgelehnt",
  counter_offer: "Gegenangebot",
  deal_created: "Deal erstellt",
};

export default function CompanyApplicationsPage() {
  const { appUser } = useAuth();
  const [applications, setApplications] = useState<CampaignApplication[]>([]);
  const [activeApplicationId, setActiveApplicationId] = useState<string | null>(null);
  const [companyMessage, setCompanyMessage] = useState("");
  const [counterPrice, setCounterPrice] = useState("");
  const [counterMessage, setCounterMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadApplications(companyId: string) {
    const snapshot = await getDocs(
      query(collection(db, "applications"), where("companyId", "==", companyId)),
    );

    setApplications(
      snapshot.docs.map((applicationDoc) => ({
        ...(applicationDoc.data() as CampaignApplication),
        id: applicationDoc.id,
      })),
    );
    setLoading(false);
  }

  useEffect(() => {
    if (!appUser) return;

    let mounted = true;

    getDocs(
      query(collection(db, "applications"), where("companyId", "==", appUser.uid)),
    ).then((snapshot) => {
      if (!mounted) return;

      setApplications(
        snapshot.docs.map((applicationDoc) => ({
          ...(applicationDoc.data() as CampaignApplication),
          id: applicationDoc.id,
        })),
      );
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [appUser]);

  async function updateApplication(
    application: CampaignApplication,
    status: CampaignApplication["status"],
  ) {
    await updateDoc(doc(db, "applications", application.id), {
      status,
      companyMessage,
      updatedAt: serverTimestamp(),
    });

    if (appUser) await loadApplications(appUser.uid);
  }

  async function sendCounterOffer(
    application: CampaignApplication,
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    await updateDoc(doc(db, "applications", application.id), {
      status: "counter_offer",
      counterOfferPrice: Number(counterPrice.replace(",", ".")) || 0,
      counterOfferMessage: counterMessage,
      companyMessage,
      updatedAt: serverTimestamp(),
    });

    setActiveApplicationId(null);
    setCounterPrice("");
    setCounterMessage("");
    setCompanyMessage("");
    if (appUser) await loadApplications(appUser.uid);
  }

  async function createDeal(application: CampaignApplication) {
    const dealRef = await addDoc(collection(db, "deals"), {
      sourceType: "application",
      sourceId: application.id,
      campaignId: application.campaignId,
      campaignTitle: application.campaignTitle,
      creatorId: application.creatorId,
      creatorName: application.creatorName,
      companyId: application.companyId,
      companyName: application.companyName,
      price: application.counterOfferPrice || application.desiredFee,
      service: application.campaignTitle,
      platform: "",
      format: "",
      deadline: application.publishDate,
      status: "contract_open",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "applications", application.id), {
      status: "deal_created",
      dealId: dealRef.id,
      updatedAt: serverTimestamp(),
    });

    if (appUser) await loadApplications(appUser.uid);
  }

  return (
    <ProtectedPage role="company">
      <DashboardShell title="Bewerbungen verwalten">
        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Kampagnenbewerbungen
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {loading ? "Laedt..." : `${applications.length} Bewerbungen`}
          </h2>
        </section>

        <section className="grid gap-4">
          {applications.map((application) => (
            <article className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" key={application.id}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-500">{application.campaignTitle}</p>
                  <h3 className="text-2xl font-semibold">{application.creatorName}</h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    Status: {statusLabels[application.status]} · Wunschgage: {application.desiredFee.toLocaleString("de-DE")} EUR
                  </p>
                </div>
                <button
                  className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold"
                  onClick={() => void updateApplication(application, "seen")}
                  type="button"
                >
                  Als gesehen markieren
                </button>
              </div>

              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-zinc-500">Nachricht</dt><dd>{application.message || "-"}</dd></div>
                <div><dt className="text-zinc-500">Warum passend?</dt><dd>{application.fitReason || "-"}</dd></div>
                <div><dt className="text-zinc-500">Videoidee</dt><dd>{application.videoIdea || "-"}</dd></div>
                <div><dt className="text-zinc-500">Veroeffentlichung</dt><dd>{application.publishDate || "-"}</dd></div>
              </dl>

              {application.files?.length ? (
                <div className="flex flex-wrap gap-2">
                  {application.files.map((file) => (
                    <a className="rounded-full border border-zinc-300 px-3 py-2 text-sm font-medium" href={file.url} key={file.path} rel="noreferrer" target="_blank">
                      {file.name}
                    </a>
                  ))}
                </div>
              ) : null}

              <TextAreaField label="Nachricht an Creator" value={companyMessage} onChange={(e) => setCompanyMessage(e.target.value)} />

              <div className="flex flex-wrap gap-2">
                <button className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold" type="button">Creator Profil ansehen</button>
                <button className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white" onClick={() => void updateApplication(application, "accepted")} type="button">Annehmen</button>
                <button className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold" onClick={() => void updateApplication(application, "rejected")} type="button">Ablehnen</button>
                <button className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold" onClick={() => setActiveApplicationId(activeApplicationId === application.id ? null : application.id)} type="button">Gegenangebot</button>
                <button className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold" onClick={() => void updateApplication(application, "in_review")} type="button">In Pruefung</button>
                <button className="rounded-full bg-zinc-800 px-4 py-2 text-sm font-semibold text-white" onClick={() => void createDeal(application)} type="button">Deal erstellen</button>
              </div>

              {activeApplicationId === application.id ? (
                <form className="grid gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4" onSubmit={(event) => void sendCounterOffer(application, event)}>
                  <TextField label="Gegenangebot Preis" inputMode="decimal" value={counterPrice} onChange={(e) => setCounterPrice(e.target.value)} />
                  <TextAreaField label="Gegenangebot Nachricht" value={counterMessage} onChange={(e) => setCounterMessage(e.target.value)} />
                  <button className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white" type="submit">
                    Gegenangebot senden
                  </button>
                </form>
              ) : null}
            </article>
          ))}
        </section>
      </DashboardShell>
    </ProtectedPage>
  );
}
