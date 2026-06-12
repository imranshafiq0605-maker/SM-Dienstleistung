"use client";

import { useParams } from "next/navigation";
import { ChatRoom } from "@/components/chat/chat-room";
import { ProtectedPage } from "@/components/auth/protected-page";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function CreatorChatRoomPage() {
  const params = useParams<{ conversationId: string }>();

  return (
    <ProtectedPage role="creator">
      <DashboardShell title="Chat">
        <ChatRoom conversationId={params.conversationId} />
      </DashboardShell>
    </ProtectedPage>
  );
}
