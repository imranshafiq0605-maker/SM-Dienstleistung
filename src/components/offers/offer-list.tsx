"use client";

import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { TextField } from "@/components/ui/form-field";
import { db } from "@/lib/firebase";
import type { Conversation, Deal, FirestoreDate, Offer, OfferStatus, UserRole } from "@/types/creatorflow";

function timeValue(value: FirestoreDate) {
  if (!value) return 0;
  if ("toMillis" in value) return value.toMillis();
  return value.getTime();
}

const statusLabels: Record<OfferStatus, string> = {
  accepted: "Angenommen",
  counter_offer: "Gegenangebot",
  deal_created: "Deal erstellt",
  rejected: "Abgelehnt",
  seen: "Gelesen",
  sent: "Gesendet",
};

function statusClass(status: OfferStatus) {
  if (status === "accepted" || status === "deal_created") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "rejected") return "bg-red-50 text-red-700 border-red-200";
  if (status === "counter_offer") return "bg-cyan-50 text-cyan-700 border-cyan-200";
  return "bg-zinc-50 text-zinc-700 border-zinc-200";
}

function conversationId(offerId: string) {
  return `offer_${offerId}`;
}

function conversationFromOffer(offer: Offer, currentUid: string): Conversation {
  const unreadForRecipient =
    offer.recipientId === currentUid || offer.status !== "sent" ? 0 : 1;

  return {
    id: conversationId(offer.id),
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
      [offer.recipientId]: unreadForRecipient,
    },
  };
}

export function OfferList({ role }: { role: Extract<UserRole, "creator" | "company"> }) {
  const { appUser } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [conversations, setConversations] = useState<Record<string, Conversation>>({});
  const [counterValues, setCounterValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  async function loadOffers() {
    if (!appUser) return;

    const field = role === "company" ? "companyId" : "creatorId";
    const [offersSnapshot, conversationSnapshot] = await Promise.all([
      getDocs(query(collection(db, "offers"), where(field, "==", appUser.uid))),
      getDocs(query(collection(db, "conversations"), where("participants", "array-contains", appUser.uid))),
    ]);

    const loadedOffers = offersSnapshot.docs
        .map((item) => ({ ...(item.data() as Offer), id: item.id }))
        .sort((a, b) => {
          return timeValue(b.createdAt) - timeValue(a.createdAt);
        });

    const conversationMap = Object.fromEntries(
      conversationSnapshot.docs.map((item) => [
        item.id,
        { ...(item.data() as Conversation), id: item.id },
      ]),
    );

    await Promise.all(
      loadedOffers
        .filter((offer) => !conversationMap[conversationId(offer.id)])
        .map(async (offer) => {
          const repairedConversation = conversationFromOffer(offer, appUser.uid);
          conversationMap[repairedConversation.id] = repairedConversation;

          await setDoc(
            doc(db, "conversations", repairedConversation.id),
            {
              companyId: repairedConversation.companyId,
              createdAt: serverTimestamp(),
              creatorId: repairedConversation.creatorId,
              lastMessage: repairedConversation.lastMessage,
              lastMessageAt: serverTimestamp(),
              participantNames: repairedConversation.participantNames,
              participants: repairedConversation.participants,
              sourceId: repairedConversation.sourceId,
              sourceType: repairedConversation.sourceType,
              title: repairedConversation.title,
              unreadBy: repairedConversation.unreadBy,
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          );
        }),
    );

    await Promise.all(
      loadedOffers
        .filter((offer) => offer.recipientId === appUser.uid && offer.status === "sent")
        .map(async (offer) => {
          await Promise.all([
            updateDoc(doc(db, "offers", offer.id), {
              status: "seen",
              updatedAt: serverTimestamp(),
            }),
            updateDoc(doc(db, "conversations", conversationId(offer.id)), {
              [`unreadBy.${appUser.uid}`]: 0,
              updatedAt: serverTimestamp(),
            }),
          ]);

          conversationMap[conversationId(offer.id)] = {
            ...conversationMap[conversationId(offer.id)],
            unreadBy: {
              ...conversationMap[conversationId(offer.id)]?.unreadBy,
              [appUser.uid]: 0,
            },
          };
        }),
    );

    setOffers(
      loadedOffers.map((offer) =>
        offer.recipientId === appUser.uid && offer.status === "sent"
          ? { ...offer, status: "seen" }
          : offer,
      ),
    );

    setConversations(conversationMap);
    setLoading(false);
  }

  useEffect(() => {
    if (!appUser) return;

    const field = role === "company" ? "companyId" : "creatorId";
    const unsubscribeOffers = onSnapshot(
      query(collection(db, "offers"), where(field, "==", appUser.uid)),
      (snapshot) => {
        const loadedOffers = snapshot.docs
          .map((item) => ({ ...(item.data() as Offer), id: item.id }))
          .sort((a, b) => timeValue(b.createdAt) - timeValue(a.createdAt));

        setOffers(loadedOffers);
        setLoading(false);

        void Promise.all(
          loadedOffers
            .filter((offer) => offer.recipientId === appUser.uid && offer.status === "sent")
            .map((offer) =>
              updateDoc(doc(db, "offers", offer.id), {
                status: "seen",
                updatedAt: serverTimestamp(),
              }),
            ),
        );
      },
    );

    const unsubscribeConversations = onSnapshot(
      query(collection(db, "conversations"), where("participants", "array-contains", appUser.uid)),
      (snapshot) => {
        setConversations(
          Object.fromEntries(
            snapshot.docs.map((item) => [
              item.id,
              { ...(item.data() as Conversation), id: item.id },
            ]),
          ),
        );
      },
    );

    return () => {
      unsubscribeOffers();
      unsubscribeConversations();
    };
  }, [appUser, role]);

  const receivedOffers = useMemo(
    () => offers.filter((offer) => offer.recipientId === appUser?.uid),
    [appUser?.uid, offers],
  );
  const sentOffers = useMemo(
    () => offers.filter((offer) => offer.senderId === appUser?.uid),
    [appUser?.uid, offers],
  );

  async function setOfferStatus(offer: Offer, status: OfferStatus) {
    await updateDoc(doc(db, "offers", offer.id), {
      status,
      updatedAt: serverTimestamp(),
    });

    const otherUid = offer.senderId === appUser?.uid ? offer.recipientId : offer.senderId;
    await updateDoc(doc(db, "conversations", conversationId(offer.id)), {
      lastMessage: `Angebot: ${statusLabels[status]}`,
      lastMessageAt: serverTimestamp(),
      [`unreadBy.${otherUid}`]: Number(conversations[conversationId(offer.id)]?.unreadBy?.[otherUid] || 0) + 1,
      updatedAt: serverTimestamp(),
    });

    setNotice(`Angebot wurde auf "${statusLabels[status]}" gesetzt.`);
    await loadOffers();
  }

  async function acceptOffer(offer: Offer) {
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
      status: "deal_created",
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "conversations", conversationId(offer.id)), {
      lastMessage: "Angebot angenommen. Deal wurde erstellt.",
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    setNotice(`Angebot angenommen. Deal erstellt: ${dealRef.id}`);
    await loadOffers();
  }

  async function sendCounterOffer(offer: Offer, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = counterValues[offer.id];
    if (!value) return;

    await updateDoc(doc(db, "offers", offer.id), {
      price: Number(value.replace(",", ".")) || offer.price,
      status: "counter_offer",
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, "messages"), {
      attachments: [],
      body: `Gegenangebot: ${value} €`,
      conversationId: conversationId(offer.id),
      createdAt: serverTimestamp(),
      readBy: appUser ? [appUser.uid] : [],
      senderId: appUser?.uid,
      senderName: appUser?.displayName,
      sourceId: offer.id,
      sourceType: "offer",
    });

    const otherUid = offer.senderId === appUser?.uid ? offer.recipientId : offer.senderId;
    await updateDoc(doc(db, "conversations", conversationId(offer.id)), {
      lastMessage: `Gegenangebot: ${value} €`,
      lastMessageAt: serverTimestamp(),
      [`unreadBy.${otherUid}`]: Number(conversations[conversationId(offer.id)]?.unreadBy?.[otherUid] || 0) + 1,
      updatedAt: serverTimestamp(),
    });

    setCounterValues((current) => ({ ...current, [offer.id]: "" }));
    setNotice("Gegenangebot wurde gesendet.");
    await loadOffers();
  }

  function OfferCard({ offer, mode }: { offer: Offer; mode: "received" | "sent" }) {
    const otherName = mode === "received" ? offer.senderName : offer.recipientName;
    const conversation = conversations[conversationId(offer.id)];
    const unread = appUser ? Number(conversation?.unreadBy?.[appUser.uid] || 0) : 0;

    return (
      <article className="premium-card rounded-lg p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-bold text-zinc-500">{otherName || "Kontakt"}</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-950">
              {offer.service || "Direktes Angebot"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {offer.price.toLocaleString("de-DE")} € · {offer.platform || "-"} · {offer.format || "-"}
            </p>
          </div>
          <span className={`w-fit rounded-full border px-3 py-1.5 text-xs font-black ${statusClass(offer.status)}`}>
            {statusLabels[offer.status]}
          </span>
        </div>

        <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-600">
          {offer.briefing || offer.message || "Kein Briefing hinterlegt."}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link className="premium-button-secondary rounded-lg px-4 py-2.5 text-sm font-black" href={`/${role}/chats/${conversationId(offer.id)}`}>
            Chat öffnen {unread ? `(${unread})` : ""}
          </Link>
          {mode === "received" ? (
            <>
              <button className="premium-button rounded-lg px-4 py-2.5 text-sm font-black" onClick={() => void acceptOffer(offer)} type="button">
                Annehmen
              </button>
              <button className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-black text-red-700" onClick={() => void setOfferStatus(offer, "rejected")} type="button">
                Ablehnen
              </button>
            </>
          ) : null}
        </div>

        <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={(event) => void sendCounterOffer(offer, event)}>
          <TextField
            label="Gegenangebot"
            onChange={(event) => setCounterValues((current) => ({ ...current, [offer.id]: event.target.value }))}
            placeholder="Preis in €"
            value={counterValues[offer.id] || ""}
          />
          <button className="premium-button-secondary mt-auto rounded-lg px-4 py-3 text-sm font-black" type="submit">
            Gegenangebot senden
          </button>
        </form>
      </article>
    );
  }

  return (
    <section className="grid gap-6">
      <div className="premium-panel rounded-lg p-6">
        <p className="premium-kicker">Angebote</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">
          {loading ? "Angebote werden geladen..." : `${offers.length} Angebote`}
        </h1>
        {notice ? <p className="mt-3 bounce-soft text-sm font-bold text-emerald-700">{notice}</p> : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="grid gap-3">
          <h2 className="text-xl font-black text-zinc-950">Empfangen</h2>
          {receivedOffers.map((offer) => <OfferCard key={offer.id} mode="received" offer={offer} />)}
          {!loading && receivedOffers.length === 0 ? (
            <p className="premium-card rounded-lg p-5 text-sm text-zinc-500">Keine empfangenen Angebote.</p>
          ) : null}
        </section>

        <section className="grid gap-3">
          <h2 className="text-xl font-black text-zinc-950">Gesendet</h2>
          {sentOffers.map((offer) => <OfferCard key={offer.id} mode="sent" offer={offer} />)}
          {!loading && sentOffers.length === 0 ? (
            <p className="premium-card rounded-lg p-5 text-sm text-zinc-500">Keine gesendeten Angebote.</p>
          ) : null}
        </section>
      </div>
    </section>
  );
}
