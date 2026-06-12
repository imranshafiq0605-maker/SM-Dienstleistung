"use client";

import { ChatList } from "@/components/chat/chat-list";
import { ProtectedPage } from "@/components/auth/protected-page";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function CompanyChatsPage() {
  return (
    <ProtectedPage role="company">
      <DashboardShell title="Chats">
        <ChatList role="company" />
      </DashboardShell>
    </ProtectedPage>
  );
}
