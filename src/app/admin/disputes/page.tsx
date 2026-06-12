"use client";

import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminSection, AdminTable, EmptyState, StatusBadge } from "@/components/admin/admin-ui";
import { db } from "@/lib/firebase";
import type { Deal, Dispute } from "@/types/creatorflow";

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [dealDisputes, setDealDisputes] = useState<Deal[]>([]);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      getDocs(collection(db, "disputes")),
      getDocs(collection(db, "deals")),
    ]).then(([disputesSnapshot, dealsSnapshot]) => {
      if (!mounted) return;

      setDisputes(
        disputesSnapshot.docs.map((item) => ({
          ...(item.data() as Dispute),
          id: item.id,
        })),
      );
      setDealDisputes(
        dealsSnapshot.docs
          .map((item) => ({
            ...(item.data() as Deal),
            id: item.id,
          }))
          .filter((deal) => deal.status === "dispute"),
      );
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AdminShell
      subtitle="Behalte Konflikte, offene Eskalationen und markierte Deals im Blick."
      title="Streitfaelle"
    >
      <AdminSection eyebrow="Disputes" title="Offene Streitfaelle">
        {disputes.length === 0 && dealDisputes.length === 0 ? (
          <EmptyState
            text="Aktuell gibt es keine offenen Streitfaelle oder markierten Deals."
            title="Alles ruhig"
          />
        ) : (
          <AdminTable columns={["Fall", "Creator", "Unternehmen", "Status"]}>
            {disputes.map((dispute) => (
              <div
                className="grid gap-3 px-4 py-4 md:grid-cols-4 md:items-center"
                key={dispute.id}
              >
                <div>
                  <p className="font-semibold text-zinc-950">
                    {dispute.title || "Streitfall"}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">{dispute.reason}</p>
                </div>
                <p className="text-sm text-zinc-600">{dispute.creatorName || "-"}</p>
                <p className="text-sm text-zinc-600">{dispute.companyName || "-"}</p>
                <StatusBadge status={dispute.status} />
              </div>
            ))}
            {dealDisputes.map((deal) => (
              <div
                className="grid gap-3 px-4 py-4 md:grid-cols-4 md:items-center"
                key={deal.id}
              >
                <div>
                  <p className="font-semibold text-zinc-950">
                    {deal.service || deal.campaignTitle || "Deal Eskalation"}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">Deal: {deal.id}</p>
                </div>
                <p className="text-sm text-zinc-600">{deal.creatorName || "-"}</p>
                <p className="text-sm text-zinc-600">{deal.companyName || "-"}</p>
                <StatusBadge status="dispute" />
              </div>
            ))}
          </AdminTable>
        )}
      </AdminSection>
    </AdminShell>
  );
}
