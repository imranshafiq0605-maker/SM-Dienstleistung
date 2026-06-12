"use client";

import { ProtectedPage } from "@/components/auth/protected-page";
import { DealList } from "@/components/deals/deal-list";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function CompanyDealsPage() {
  return (
    <ProtectedPage role="company">
      <DashboardShell title="Deals">
        <DealList role="company" />
      </DashboardShell>
    </ProtectedPage>
  );
}
