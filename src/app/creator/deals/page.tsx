"use client";

import { ProtectedPage } from "@/components/auth/protected-page";
import { DealList } from "@/components/deals/deal-list";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function CreatorDealsPage() {
  return (
    <ProtectedPage role="creator">
      <DashboardShell title="Deals">
        <DealList role="creator" />
      </DashboardShell>
    </ProtectedPage>
  );
}
