"use client";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { TextAreaField, TextField } from "@/components/ui/form-field";
import { db } from "@/lib/firebase";
import type { ChatMessage, Conversation, Deal, Offer } from "@/types/creatorflow";

function ticks(message: ChatMessage, currentUid: string) {
  if (message.senderId !== currentUid) return "";
  const readCount = message.readBy?.length || 0;
  if (readCount >= 2) return "✓✓";
  if (readCount === 1) return "✓";
  return "✓";
}

export function ChatRoom({ conversationId }: { conversationId: string }) {
  const { appUser } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [body, setBody] = useState("");
  const [counterPrice, setCounterPrice] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");

  async function loadChat(markRead = true) {
    if (!appUser) return;

    const [conversationSnapshot, messagesSnapshot] = await Promise.all([
      getDoc(doc(db, "conversations", conversationId)),
      getDocs(
        query(
          collection(db, "messages"),
          where("conversationId", "==", conversationId),
          orderBy("createdAt", "asc"),
        ),
      ),
    ]);

    const loadedConversation = conversationSnapshot.exists()
      ? ({ ...(conversationSnapshot.data() as Conversation), id: conversationSnapshot.id })
      : null;

    setConversation(loadedConversation);
    const loadedMessages = messagesSnapshot.docs.map((item) => ({
      ...(item.data() as ChatMessage),
      id: item.id,
    }));
    setMessages(loadedMessages);

    if (loadedConversation?.sourceType === "offer") {
      const offerSnapshot = await getDoc(doc(db, "offers", loadedConversation.sourceId));
      setOffer(offerSnapshot.exists() ? ({ ...(offerSnapshot.data() as Offer), id: offerSnapshot.id }) : null);
    }

    if (markRead && loadedConversation) {
      await Promise.all(
        loadedMessages
          .filter((message) => !message.readBy?.includes(appUser.uid))
          .map((message) =>
            updateDoc(doc(db, "messages", message.id), {
              readBy: [...(message.readBy ?? []), appUser.uid],
            }),
          ),
      );

      await updateDoc(doc(db, "conversations", conversationId), {
        [`unreadBy.${appUser.uid}`]: 0,
        updatedAt: serverTimestamp(),
      });
    }
  }

  useEffect(() => {
    Promise.resolve().then(() => void loadChat());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser, conversationId]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!appUser || !conversation || !body.trim()) return;

    setSending(true);
    const otherUid = conversation.participants.find((id) => id !== appUser.uid);

    await addDoc(collection(db, "messages"), {
      attachments: [],
      body,
      conversationId,
      createdAt: serverTimestamp(),
      readBy: [appUser.uid],
      senderId: appUser.uid,
      senderName: appUser.displayName,
      sourceId: conversation.sourceId,
      sourceType: conversation.sourceType,
    });

    await updateDoc(doc(db, "conversations", conversationId), {
      lastMessage: body,
      lastMessageAt: serverTimestamp(),
      ...(otherUid ? { [`unreadBy.${otherUid}`]: Number(conversation.unreadBy?.[otherUid] || 0) + 1 } : {}),
      updatedAt: serverTimestamp(),
    });

    setBody("");
    setNotice("Nachricht gesendet.");
    setSending(false);
    await loadChat(false);
  }

  async function acceptOffer() {
    if (!offer || !conversation) return;

    const dealRef = await addDoc(collection(db, "deals"), {
      campaignId: offer.campaignId || "",
      campaignTitle: offer.campaignTitle || "",
      companyId: offer.companyId,
      companyName: offer.direction === "company_to_creator" ? offer.senderName : offer.recipientName,
      createdAt: serverTimestamp(),
      creatorId: offer.creatorId,
      creatorName: offer.direction === "company_to_creator" ? offer.recipientName : offer.senderName,
      deadline: offer.deadline,
      format: offer.format,
      platform: offer.platform,
      price: offer.price,
      service: offer.service,
      sourceId: offer.id,
      sourceType: "offer",
      status: "contract_open" satisfies Deal["status"],
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "offers", offer.id), {
      status: "accepted",
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "conversations", conversation.id), {
      lastMessage: "Angebot wurde angenommen. Deal wurde erstellt.",
      sourceId: offer.id,
      updatedAt: serverTimestamp(),
    });

    setNotice(`Angebot angenommen. Deal erstellt: ${dealRef.id}`);
    await loadChat(false);
  }

  async function counterOffer() {
    if (!offer || !counterPrice) return;

    await updateDoc(doc(db, "offers", offer.id), {
      price: Number(counterPrice.replace(",", ".")) || offer.price,
      status: "counter_offer",
      updatedAt: serverTimestamp(),
    });

    setBody(`Gegenangebot: ${counterPrice} €`);
    setCounterPrice("");
    setNotice("Gegenangebot gespeichert. Du kannst es jetzt als Nachricht senden.");
    await loadChat(false);
  }

  if (!appUser || !conversation) {
    return (
      <section className="premium-panel rounded-lg p-6 text-sm text-zinc-500">
        Chat wird geladen...
      </section>
    );
  }

  const otherUid = conversation.participants.find((id) => id !== appUser.uid) || "";
  const otherName = conversation.participantNames?.[otherUid] || "Kontakt";

  return (
    <section className="premium-panel overflow-hidden rounded-lg">
      <div className="border-b border-zinc-200 bg-white/70 p-5">
        <p className="premium-kicker">Chat</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">{otherName}</h1>
        {notice ? <p className="mt-3 bounce-soft text-sm font-bold text-emerald-700">{notice}</p> : null}
      </div>

      {offer ? (
        <div className="grid gap-3 border-b border-zinc-200 bg-zinc-50 p-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="font-black text-zinc-950">{offer.service || "Angebot"}</p>
            <p className="mt-1 text-sm text-zinc-500">
              {offer.price.toLocaleString("de-DE")} € · {offer.platform || "-"} · {offer.status}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="premium-button rounded-lg px-4 py-2 text-sm font-black" onClick={() => void acceptOffer()} type="button">
              Annehmen
            </button>
            <div className="flex gap-2">
              <TextField label="Gegenangebot" onChange={(e) => setCounterPrice(e.target.value)} value={counterPrice} />
              <button className="premium-button-secondary mt-auto rounded-lg px-4 py-2 text-sm font-black" onClick={() => void counterOffer()} type="button">
                Senden
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid max-h-[58vh] gap-3 overflow-y-auto bg-[linear-gradient(180deg,#f8fafc,#eef2f7)] p-4">
        {messages.map((message) => {
          const mine = message.senderId === appUser.uid;
          const read = ticks(message, appUser.uid);

          return (
            <article
              className={`slide-in-right max-w-[82%] rounded-[1.35rem] px-4 py-3 shadow-sm ${
                mine
                  ? "ml-auto bg-zinc-950 text-white"
                  : "mr-auto bg-white text-zinc-950"
              }`}
              key={message.id}
            >
              <p className="text-sm leading-6">{message.body}</p>
              <p className={`mt-1 text-right text-xs ${mine && read === "✓✓" && (message.readBy?.length || 0) > 1 ? "text-cyan-300" : mine ? "text-white/55" : "text-zinc-400"}`}>
                {mine ? read : ""}
              </p>
            </article>
          );
        })}
      </div>

      <form className="grid gap-3 border-t border-zinc-200 bg-white/80 p-4" onSubmit={(event) => void sendMessage(event)}>
        <TextAreaField label="Nachricht" onChange={(event) => setBody(event.target.value)} value={body} />
        <button className="premium-button rounded-lg px-5 py-3 text-sm font-black disabled:opacity-50" disabled={sending} type="submit">
          {sending ? "Sendet..." : "Nachricht senden"}
        </button>
      </form>
    </section>
  );
}
