"use client";

import { ProtectedPage } from "@/components/auth/protected-page";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { OfferForm } from "@/components/offers/offer-form";

export default function CreatorNewOfferPage() {
  return (
    <ProtectedPage role="creator">
      <DashboardShell title="Kooperationsanfrage senden">
        <OfferForm direction="creator_to_company" />
      </DashboardShell>
    </ProtectedPage>
  );
}
