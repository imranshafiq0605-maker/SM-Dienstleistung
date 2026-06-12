"use client";

import { collection, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminSection, AdminTable, EmptyState, StatusBadge } from "@/components/admin/admin-ui";
import { db } from "@/lib/firebase";
import type { Campaign, CampaignStatus } from "@/types/creatorflow";

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getDocs(collection(db, "campaigns")).then((snapshot) => {
      if (!mounted) return;

      setCampaigns(
        snapshot.docs.map((item) => ({
          ...(item.data() as Campaign),
          id: item.id,
        })),
      );
    });

    return () => {
      mounted = false;
    };
  }, []);

  async function updateCampaignStatus(id: string, status: CampaignStatus) {
    setUpdatingId(id);
    await updateDoc(doc(db, "campaigns", id), {
      status,
      updatedAt: serverTimestamp(),
    });
    setCampaigns((current) =>
      current.map((campaign) =>
        campaign.id === id ? { ...campaign, status } : campaign,
      ),
    );
    setUpdatingId(null);
  }

  return (
    <AdminShell
      subtitle="Pruefe Briefings, Budgets, Produktangaben und Sichtbarkeit von Kampagnen."
      title="Kampagnen pruefen"
    >
      <AdminSection eyebrow="Campaigns" title="Kampagnenuebersicht">
        {campaigns.length === 0 ? (
          <EmptyState
            text="Sobald Unternehmen Kampagnen erstellen, kannst du sie hier pruefen und freischalten."
            title="Noch keine Kampagnen vorhanden"
          />
        ) : (
          <AdminTable columns={["Kampagne", "Unternehmen", "Budget", "Status", "Aktionen"]}>
            {campaigns.map((campaign) => (
              <div
                className="grid gap-3 px-4 py-4 md:grid-cols-5 md:items-center"
                key={campaign.id}
              >
                <div>
                  <p className="font-semibold text-zinc-950">{campaign.title}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {campaign.category || "Ohne Kategorie"}
                  </p>
                </div>
                <p className="text-sm text-zinc-600">{campaign.companyName || "-"}</p>
                <p className="text-sm font-medium text-zinc-700">
                  {Number(campaign.feeMin || 0)} - {Number(campaign.feeMax || 0)} EUR
                </p>
                <StatusBadge status={campaign.status} />
                <div className="flex flex-wrap gap-2">
                  <button
                    className="premium-button rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50"
                    disabled={updatingId === campaign.id}
                    onClick={() => void updateCampaignStatus(campaign.id, "active")}
                    type="button"
                  >
                    Aktiv
                  </button>
                  <button
                    className="premium-button-secondary rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50"
                    disabled={updatingId === campaign.id}
                    onClick={() => void updateCampaignStatus(campaign.id, "closed")}
                    type="button"
                  >
                    Schliessen
                  </button>
                </div>
              </div>
            ))}
          </AdminTable>
        )}
      </AdminSection>
    </AdminShell>
  );
}
