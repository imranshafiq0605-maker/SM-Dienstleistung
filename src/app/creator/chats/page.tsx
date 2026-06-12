"use client";

import { ChatList } from "@/components/chat/chat-list";
import { ProtectedPage } from "@/components/auth/protected-page";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function CreatorChatsPage() {
  return (
    <ProtectedPage role="creator">
      <DashboardShell title="Chats">
        <ChatList role="creator" />
      </DashboardShell>
    </ProtectedPage>
  );
}
