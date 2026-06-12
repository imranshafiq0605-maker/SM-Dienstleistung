"use client";

import { useParams } from "next/navigation";
import { ProtectedPage } from "@/components/auth/protected-page";
import { DealWorkspace } from "@/components/deals/deal-workspace";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function CreatorDealDetailPage() {
  const params = useParams<{ dealId: string }>();

  return (
    <ProtectedPage role="creator">
      <DashboardShell title="Deal Workspace">
        <DealWorkspace dealId={params.dealId} role="creator" />
      </DashboardShell>
    </ProtectedPage>
  );
}
