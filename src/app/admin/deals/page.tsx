"use client";

import { collection, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  AdminSection,
  AdminStatCard,
  AdminTable,
  EmptyState,
  StatusBadge,
} from "@/components/admin/admin-ui";
import { db } from "@/lib/firebase";
import type { Deal, DealStatus, Offer } from "@/types/creatorflow";

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

  async function markPaymentReceived(deal: Deal) {
    await updateDealStatus(deal.id, deal.productShipping ? "shipping_open" : "payment_received");
  }

  async function markPaidOut(deal: Deal) {
    setUpdatingId(deal.id);
    await updateDoc(doc(db, "deals", deal.id), {
      paidOutAt: serverTimestamp(),
      payoutStatus: "paid_out",
      status: "paid_out",
      updatedAt: serverTimestamp(),
    });
    setDeals((current) =>
      current.map((item) =>
        item.id === deal.id ? { ...item, payoutStatus: "paid_out", status: "paid_out" } : item,
      ),
    );
    setUpdatingId(null);
  }

  return (
    <AdminShell
      subtitle="Überwache Angebote, laufende Kooperationen, Content-Phasen und Zahlungsstatus."
      title="Deals & Angebote"
    >
      <section className="grid gap-4 md:grid-cols-4">
        <AdminStatCard
          detail="Alle Kooperationen"
          label="Deals"
          value={deals.length}
        />
        <AdminStatCard
          detail="Noch nicht abgeschlossen"
          label="Offen"
          value={
            deals.filter((deal) => !["completed", "paid_out"].includes(deal.status))
              .length
          }
        />
        <AdminStatCard
          detail="Direkte Angebote und Anfragen"
          label="Angebote"
          value={offers.length}
        />
        <AdminStatCard
          detail="Bei 15% Plattformfee"
          label="Umsatz"
          value={`${deals
            .reduce((sum, deal) => sum + Number(deal.price || 0) * 0.15, 0)
            .toLocaleString("de-DE")} EUR`}
        />
      </section>

      <AdminSection eyebrow="Deals" title="Kooperationen überwachen">
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
                <div className="flex flex-wrap gap-2">
                  {deal.status === "payment_open" ? (
                    <button
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 disabled:opacity-50"
                      disabled={updatingId === deal.id}
                      onClick={() => void markPaymentReceived(deal)}
                      type="button"
                    >
                      Zahlung eingegangen
                    </button>
                  ) : null}
                  {deal.status === "completed" || deal.payoutStatus === "payout_open" ? (
                    <button
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50"
                      disabled={updatingId === deal.id}
                      onClick={() => void markPaidOut(deal)}
                      type="button"
                    >
                      Auszahlung erledigt
                    </button>
                  ) : null}
                  {deal.status !== "payment_open" && deal.status !== "completed" && deal.payoutStatus !== "payout_open" ? (
                    <span className="text-sm font-medium text-zinc-500">Keine Aktion</span>
                  ) : null}
                </div>
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

