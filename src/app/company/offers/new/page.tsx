"use client";

import { ProtectedPage } from "@/components/auth/protected-page";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { OfferForm } from "@/components/offers/offer-form";

export default function CompanyNewOfferPage() {
  return (
    <ProtectedPage role="company">
      <DashboardShell title="Direktes Angebot senden">
        <OfferForm direction="company_to_creator" />
      </DashboardShell>
    </ProtectedPage>
  );
}
