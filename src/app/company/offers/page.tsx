"use client";

import { ProtectedPage } from "@/components/auth/protected-page";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { OfferList } from "@/components/offers/offer-list";

export default function CompanyOffersPage() {
  return (
    <ProtectedPage role="company">
      <DashboardShell title="Angebote">
        <OfferList role="company" />
      </DashboardShell>
    </ProtectedPage>
  );
}
