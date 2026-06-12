"use client";

import { useParams } from "next/navigation";
import { ChatRoom } from "@/components/chat/chat-room";
import { ProtectedPage } from "@/components/auth/protected-page";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function CompanyChatRoomPage() {
  const params = useParams<{ conversationId: string }>();

  return (
    <ProtectedPage role="company">
      <DashboardShell title="Chat">
        <ChatRoom conversationId={params.conversationId} />
      </DashboardShell>
    </ProtectedPage>
  );
}
