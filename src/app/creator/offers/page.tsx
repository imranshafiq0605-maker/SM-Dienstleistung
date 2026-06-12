"use client";

import { ProtectedPage } from "@/components/auth/protected-page";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { OfferList } from "@/components/offers/offer-list";

export default function CreatorOffersPage() {
  return (
    <ProtectedPage role="creator">
      <DashboardShell title="Angebote">
        <OfferList role="creator" />
      </DashboardShell>
    </ProtectedPage>
  );
}
