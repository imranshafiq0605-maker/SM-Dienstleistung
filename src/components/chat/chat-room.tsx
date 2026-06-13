"use client";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { TextAreaField, TextField } from "@/components/ui/form-field";
import { db } from "@/lib/firebase";
import type { ChatMessage, Conversation, Deal, FirestoreDate, Offer } from "@/types/creatorflow";

function timeValue(value: FirestoreDate) {
  if (!value) return 0;
  if ("toMillis" in value) return value.toMillis();
  return value.getTime();
}

function ticks(message: ChatMessage, currentUid: string) {
  if (message.senderId !== currentUid) return "";
  const otherRead = message.readBy?.some((uid) => uid !== currentUid);
  return otherRead ? "✓✓" : "✓";
}

function repairedConversationFromOffer(offer: Offer): Conversation {
  return {
    id: `offer_${offer.id}`,
    companyId: offer.companyId,
    createdAt: null,
    creatorId: offer.creatorId,
    lastMessage: offer.briefing || offer.message || offer.service || "Neues Angebot",
    lastMessageAt: offer.createdAt,
    participantNames: {
      [offer.senderId]: offer.senderName,
      [offer.recipientId]: offer.recipientName,
    },
    participants: [offer.senderId, offer.recipientId],
    sourceId: offer.id,
    sourceType: "offer",
    title: offer.service || "Direktes Angebot",
    unreadBy: {
      [offer.senderId]: 0,
      [offer.recipientId]: offer.status === "sent" ? 1 : 0,
    },
  };
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
        ),
      ),
    ]);

    let loadedConversation = conversationSnapshot.exists()
      ? ({ ...(conversationSnapshot.data() as Conversation), id: conversationSnapshot.id })
      : null;

    if (!loadedConversation && conversationId.startsWith("offer_")) {
      const offerId = conversationId.replace("offer_", "");
      const offerSnapshot = await getDoc(doc(db, "offers", offerId));
      const loadedOffer = offerSnapshot.exists()
        ? ({ ...(offerSnapshot.data() as Offer), id: offerSnapshot.id })
        : null;

      if (
        loadedOffer &&
        (loadedOffer.senderId === appUser.uid || loadedOffer.recipientId === appUser.uid)
      ) {
        loadedConversation = repairedConversationFromOffer(loadedOffer);
        await setDoc(
          doc(db, "conversations", loadedConversation.id),
          {
            companyId: loadedConversation.companyId,
            createdAt: serverTimestamp(),
            creatorId: loadedConversation.creatorId,
            lastMessage: loadedConversation.lastMessage,
            lastMessageAt: serverTimestamp(),
            participantNames: loadedConversation.participantNames,
            participants: loadedConversation.participants,
            sourceId: loadedConversation.sourceId,
            sourceType: loadedConversation.sourceType,
            title: loadedConversation.title,
            unreadBy: loadedConversation.unreadBy,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      }
    }

    setConversation(loadedConversation);
    const loadedMessages = messagesSnapshot.docs.map((item) => ({
      ...(item.data() as ChatMessage),
      id: item.id,
    })).sort((a, b) => {
      return timeValue(a.createdAt) - timeValue(b.createdAt);
    });
    setMessages(loadedMessages);

    if (loadedConversation?.sourceType === "offer") {
      const offerSnapshot = await getDoc(doc(db, "offers", loadedConversation.sourceId));
      const loadedOffer = offerSnapshot.exists()
        ? ({ ...(offerSnapshot.data() as Offer), id: offerSnapshot.id })
        : null;
      setOffer(loadedOffer);

      if (loadedOffer?.recipientId === appUser.uid && loadedOffer.status === "sent") {
        await updateDoc(doc(db, "offers", loadedOffer.id), {
          status: "seen",
          updatedAt: serverTimestamp(),
        });
        setOffer({ ...loadedOffer, status: "seen" });
      }
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
    if (!appUser) return;

    const currentUid = appUser.uid;
    let unsubscribeConversation = () => {};
    let unsubscribeMessages = () => {};
    let mounted = true;

    async function connectLiveChat() {
      await loadChat();
      if (!mounted) return;

      unsubscribeConversation = onSnapshot(doc(db, "conversations", conversationId), (snapshot) => {
        if (snapshot.exists()) {
          setConversation({ ...(snapshot.data() as Conversation), id: snapshot.id });
        }
      });

      unsubscribeMessages = onSnapshot(
        query(collection(db, "messages"), where("conversationId", "==", conversationId)),
        (snapshot) => {
          const loadedMessages = snapshot.docs
            .map((item) => ({ ...(item.data() as ChatMessage), id: item.id }))
            .sort((a, b) => timeValue(a.createdAt) - timeValue(b.createdAt));

          setMessages(loadedMessages);

          const unreadMessages = loadedMessages.filter(
            (message) => !message.readBy?.includes(currentUid),
          );

          if (unreadMessages.length) {
            void Promise.all(
              unreadMessages.map((message) =>
                updateDoc(doc(db, "messages", message.id), {
                  readBy: [...(message.readBy ?? []), currentUid],
                }),
              ),
            ).then(() =>
              updateDoc(doc(db, "conversations", conversationId), {
                [`unreadBy.${currentUid}`]: 0,
                updatedAt: serverTimestamp(),
              }),
            );
          }
        },
      );
    }

    void connectLiveChat();

    return () => {
      mounted = false;
      unsubscribeConversation();
      unsubscribeMessages();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser, conversationId]);

  useEffect(() => {
    if (!appUser || conversation?.sourceType !== "offer") return;

    const unsubscribe = onSnapshot(doc(db, "offers", conversation.sourceId), (snapshot) => {
      if (!snapshot.exists()) return;

      const loadedOffer = { ...(snapshot.data() as Offer), id: snapshot.id };
      setOffer(loadedOffer);

      if (loadedOffer.recipientId === appUser.uid && loadedOffer.status === "sent") {
        void updateDoc(doc(db, "offers", loadedOffer.id), {
          status: "seen",
          updatedAt: serverTimestamp(),
        });
      }
    });

    return unsubscribe;
  }, [appUser, conversation?.sourceId, conversation?.sourceType]);

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
  }

  async function acceptOffer() {
    if (!offer || !conversation) return;
    if (["accepted", "deal_created", "rejected"].includes(offer.status)) {
      setNotice("Dieses Angebot ist bereits abgeschlossen.");
      return;
    }

    const price = Number(offer.price || 0);
    const platformFee = price * 0.15;
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
      price,
      platformFee,
      platformFeeRate: 0.15,
      creatorPayout: price - platformFee,
      payoutStatus: "not_ready",
      companyInvoiceStatus: "open",
      creatorInvoiceStatus: "missing",
      productPackage: offer.productShipping,
      productShipping: offer.productShipping,
      service: offer.service,
      sourceId: offer.id,
      sourceType: "offer",
      status: "payment_open" satisfies Deal["status"],
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "offers", offer.id), {
      status: "deal_created",
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "conversations", conversation.id), {
      lastMessage: "Angebot wurde angenommen. Deal wurde erstellt.",
      sourceId: offer.id,
      updatedAt: serverTimestamp(),
    });

    setNotice(`Angebot angenommen. Deal erstellt: ${dealRef.id}`);
  }

  async function counterOffer() {
    if (!offer || !conversation || !appUser || !counterPrice) return;
    if (["accepted", "deal_created", "rejected"].includes(offer.status)) {
      setNotice("Dieses Angebot ist bereits abgeschlossen.");
      return;
    }

    const otherUid = conversation.participants.find((id) => id !== appUser.uid);
    const message = `Gegenangebot: ${counterPrice} €`;

    await updateDoc(doc(db, "offers", offer.id), {
      counterOfferAt: serverTimestamp(),
      counterOfferBy: appUser.uid,
      price: Number(counterPrice.replace(",", ".")) || offer.price,
      status: "counter_offer",
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, "messages"), {
      attachments: [],
      body: message,
      conversationId,
      createdAt: serverTimestamp(),
      readBy: [appUser.uid],
      senderId: appUser.uid,
      senderName: appUser.displayName,
      sourceId: offer.id,
      sourceType: "offer",
    });

    await updateDoc(doc(db, "conversations", conversation.id), {
      lastMessage: message,
      lastMessageAt: serverTimestamp(),
      ...(otherUid ? { [`unreadBy.${otherUid}`]: Number(conversation.unreadBy?.[otherUid] || 0) + 1 } : {}),
      updatedAt: serverTimestamp(),
    });

    setCounterPrice("");
    setNotice("Gegenangebot wurde gesendet.");
  }

  async function rejectOffer() {
    if (!offer || !conversation || !appUser) return;

    const otherUid = conversation.participants.find((id) => id !== appUser.uid);

    await updateDoc(doc(db, "offers", offer.id), {
      status: "rejected",
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, "messages"), {
      attachments: [],
      body: "Angebot wurde abgelehnt.",
      conversationId,
      createdAt: serverTimestamp(),
      readBy: [appUser.uid],
      senderId: appUser.uid,
      senderName: appUser.displayName,
      sourceId: offer.id,
      sourceType: "offer",
    });

    await updateDoc(doc(db, "conversations", conversation.id), {
      lastMessage: "Angebot wurde abgelehnt.",
      lastMessageAt: serverTimestamp(),
      ...(otherUid ? { [`unreadBy.${otherUid}`]: Number(conversation.unreadBy?.[otherUid] || 0) + 1 } : {}),
      updatedAt: serverTimestamp(),
    });

    setNotice("Angebot wurde abgelehnt.");
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
  const canRespondToOffer =
    !!offer &&
    !["accepted", "deal_created", "rejected"].includes(offer.status) &&
    (offer.status === "counter_offer"
      ? offer.counterOfferBy !== appUser.uid
      : offer.recipientId === appUser.uid);
  const canCounterOffer =
    !!offer && !["accepted", "deal_created", "rejected"].includes(offer.status);

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
            {canRespondToOffer ? (
              <>
                <button className="premium-button rounded-lg px-4 py-2 text-sm font-black" onClick={() => void acceptOffer()} type="button">
                  Annehmen
                </button>
                <button className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-black text-red-700" onClick={() => void rejectOffer()} type="button">
                  Ablehnen
                </button>
              </>
            ) : null}
            {canCounterOffer ? (
              <div className="flex gap-2">
                <TextField label="Gegenangebot" onChange={(e) => setCounterPrice(e.target.value)} value={counterPrice} />
                <button className="premium-button-secondary mt-auto rounded-lg px-4 py-2 text-sm font-black" onClick={() => void counterOffer()} type="button">
                  Senden
                </button>
              </div>
            ) : null}
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
              <p className={`mt-1 text-right text-xs ${mine && read === "✓✓" ? "text-cyan-300" : mine ? "text-white/55" : "text-zinc-400"}`}>
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
