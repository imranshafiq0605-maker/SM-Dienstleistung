"use client";

import { collection, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminSection, AdminTable, EmptyState, StatusBadge } from "@/components/admin/admin-ui";
import { db } from "@/lib/firebase";
import type { Deal, DealStatus, Offer } from "@/types/creatorflow";

const dealStatuses: DealStatus[] = [
  "contract_open",
  "payment_open",
  "payment_received",
  "shipping_open",
  "product_shipped",
  "product_arrived",
  "content_in_progress",
  "content_uploaded",
  "feedback_open",
  "revision",
  "approved",
  "published",
  "completed",
  "payout_open",
  "paid_out",
  "dispute",
];

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      getDocs(collection(db, "deals")),
      getDocs(collection(db, "offers")),
    ]).then(([dealsSnapshot, offersSnapshot]) => {
      if (!mounted) return;

      setDeals(
        dealsSnapshot.docs.map((item) => ({
          ...(item.data() as Deal),
          id: item.id,
        })),
      );
      setOffers(
        offersSnapshot.docs.map((item) => ({
          ...(item.data() as Offer),
          id: item.id,
        })),
      );
    });

    return () => {
      mounted = false;
    };
  }, []);

  async function updateDealStatus(id: string, status: DealStatus) {
    setUpdatingId(id);
    await updateDoc(doc(db, "deals", id), {
      status,
      updatedAt: serverTimestamp(),
    });
    setDeals((current) =>
      current.map((deal) => (deal.id === id ? { ...deal, status } : deal)),
    );
    setUpdatingId(null);
  }

  return (
    <AdminShell
      subtitle="Ueberwache Angebote, laufende Kooperationen, Content-Phasen und Zahlungsstatus."
      title="Deals & Angebote"
    >
      <AdminSection eyebrow="Deals" title="Kooperationen ueberwachen">
        {deals.length === 0 ? (
          <EmptyState
            text="Abgeschlossene Bewerbungen und angenommene Angebote werden als Deals hier sichtbar."
            title="Noch keine Deals vorhanden"
          />
        ) : (
          <AdminTable columns={["Deal", "Creator", "Unternehmen", "Status", "Aktion"]}>
            {deals.map((deal) => (
              <div
                className="grid gap-3 px-4 py-4 md:grid-cols-5 md:items-center"
                key={deal.id}
              >
                <div>
                  <p className="font-semibold text-zinc-950">
                    {deal.service || deal.campaignTitle || "Kooperation"}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {Number(deal.price || 0).toLocaleString("de-DE")} EUR
                  </p>
                </div>
                <p className="text-sm text-zinc-600">{deal.creatorName || "-"}</p>
                <p className="text-sm text-zinc-600">{deal.companyName || "-"}</p>
                <StatusBadge status={deal.status} />
                <select
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium disabled:opacity-50"
                  disabled={updatingId === deal.id}
                  onChange={(event) =>
                    void updateDealStatus(deal.id, event.target.value as DealStatus)
                  }
                  value={deal.status}
                >
                  {dealStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </AdminTable>
        )}
      </AdminSection>

      <AdminSection eyebrow="Offers" title="Angebote beobachten">
        {offers.length === 0 ? (
          <EmptyState
            text="Direkte Angebote und Kooperationsanfragen erscheinen hier, sobald Nutzer sie senden."
            title="Noch keine Angebote vorhanden"
          />
        ) : (
          <AdminTable columns={["Angebot", "Von", "An", "Status"]}>
            {offers.map((offer) => (
              <div
                className="grid gap-3 px-4 py-4 md:grid-cols-4 md:items-center"
                key={offer.id}
              >
                <div>
                  <p className="font-semibold text-zinc-950">{offer.service}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {Number(offer.price || 0).toLocaleString("de-DE")} EUR
                  </p>
                </div>
                <p className="text-sm text-zinc-600">{offer.senderName || "-"}</p>
                <p className="text-sm text-zinc-600">{offer.recipientName || "-"}</p>
                <StatusBadge status={offer.status} />
              </div>
            ))}
          </AdminTable>
        )}
      </AdminSection>
    </AdminShell>
  );
}
