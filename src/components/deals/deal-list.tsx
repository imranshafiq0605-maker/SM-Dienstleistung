"use client";

import { collection, getDocs, query, where } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { db } from "@/lib/firebase";
import type { Deal, UserRole } from "@/types/creatorflow";

const dealStatusLabels: Record<Deal["status"], string> = {
  contract_open: "Vertrag offen",
  payment_open: "Zahlung offen",
  payment_received: "Zahlung eingegangen",
  shipping_open: "Produktversand offen",
  product_shipped: "Produkt versendet",
  product_arrived: "Produkt angekommen",
  content_in_progress: "Content in Arbeit",
  content_uploaded: "Content hochgeladen",
  feedback_open: "Feedback offen",
  revision: "Ueberarbeitung",
  approved: "Freigegeben",
  published: "Veroeffentlicht",
  completed: "Abgeschlossen",
  payout_open: "Auszahlung offen",
  paid_out: "Ausgezahlt",
  dispute: "Streitfall",
};

export function DealList({ role }: { role: Extract<UserRole, "creator" | "company"> }) {
  const { appUser } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser) return;

    const field = role === "creator" ? "creatorId" : "companyId";

    getDocs(query(collection(db, "deals"), where(field, "==", appUser.uid))).then(
      (snapshot) => {
        setDeals(
          snapshot.docs.map((dealDoc) => ({
            ...(dealDoc.data() as Deal),
            id: dealDoc.id,
          })),
        );
        setLoading(false);
      },
    );
  }, [appUser, role]);

  return (
    <section className="grid gap-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Kooperationen
        </p>
        <h2 className="mt-2 text-2xl font-semibold">
          {loading ? "Laedt..." : `${deals.length} Deals`}
        </h2>
      </div>

      {deals.map((deal) => (
        <article className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" key={deal.id}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500">
                {role === "creator" ? deal.companyName : deal.creatorName}
              </p>
              <h3 className="text-2xl font-semibold">{deal.service || deal.campaignTitle || "Deal"}</h3>
            </div>
            <span className="w-fit rounded-full bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-700">
              {dealStatusLabels[deal.status]}
            </span>
          </div>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-zinc-500">Preis</dt><dd>{deal.price ? `${deal.price.toLocaleString("de-DE")} EUR` : "-"}</dd></div>
            <div><dt className="text-zinc-500">Deadline</dt><dd>{deal.deadline || "-"}</dd></div>
            <div><dt className="text-zinc-500">Plattform</dt><dd>{deal.platform || "-"}</dd></div>
            <div><dt className="text-zinc-500">Format</dt><dd>{deal.format || "-"}</dd></div>
          </dl>
          <Link className="w-fit rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white" href={`/${role}/deals/${deal.id}`}>
            Deal oeffnen
          </Link>
        </article>
      ))}

      {!loading && deals.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
          Noch keine Deals vorhanden.
        </p>
      ) : null}
    </section>
  );
}
