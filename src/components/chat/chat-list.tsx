"use client";

import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { db } from "@/lib/firebase";
import type { Conversation, UserRole } from "@/types/creatorflow";

export function ChatList({ role }: { role: Extract<UserRole, "creator" | "company"> }) {
  const { appUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser) return;

    getDocs(
      query(
        collection(db, "conversations"),
        where("participants", "array-contains", appUser.uid),
        orderBy("lastMessageAt", "desc"),
      ),
    ).then((snapshot) => {
      setConversations(
        snapshot.docs.map((item) => ({
          ...(item.data() as Conversation),
          id: item.id,
        })),
      );
      setLoading(false);
    });
  }, [appUser]);

  return (
    <section className="grid gap-4">
      <div className="premium-panel rounded-lg p-6">
        <p className="premium-kicker">Nachrichten</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">
          {loading ? "Chats werden geladen..." : `${conversations.length} Chats`}
        </h1>
      </div>

      <div className="grid gap-3">
        {conversations.map((conversation) => {
          const unread = appUser ? Number(conversation.unreadBy?.[appUser.uid] || 0) : 0;
          const otherId = conversation.participants.find((id) => id !== appUser?.uid) || "";
          const otherName = conversation.participantNames?.[otherId] || "Kontakt";

          return (
            <Link
              className="premium-card slide-in-right rounded-lg p-4 hover:border-zinc-300"
              href={`/${role}/chats/${conversation.id}`}
              key={conversation.id}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-lg font-black text-zinc-950">{otherName}</p>
                  <p className="mt-1 truncate text-sm font-medium text-zinc-500">
                    {conversation.lastMessage || "Noch keine Nachricht"}
                  </p>
                </div>
                {unread ? (
                  <span className="grid h-7 min-w-7 place-items-center rounded-full bg-red-500 px-2 text-xs font-black text-white">
                    {unread}
                  </span>
                ) : (
                  <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-bold text-zinc-500">
                    Gelesen
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {!loading && conversations.length === 0 ? (
        <p className="premium-panel rounded-lg p-6 text-sm text-zinc-500">
          Noch keine Chats. Sobald du ein Angebot oder eine Anfrage sendest,
          entsteht automatisch ein Chat.
        </p>
      ) : null}
    </section>
  );
}
