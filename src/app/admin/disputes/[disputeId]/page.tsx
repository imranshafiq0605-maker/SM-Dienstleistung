"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/admin/admin-ui";
import { TextAreaField } from "@/components/ui/form-field";
import { db } from "@/lib/firebase";
import type { ChatMessage, Deal, Dispute, FirestoreDate } from "@/types/creatorflow";

function timeValue(value: FirestoreDate) {
  if (!value) return 0;
  if ("toMillis" in value) return value.toMillis();
  return value.getTime();
}

export default function AdminDisputeDetailPage() {
  const params = useParams<{ disputeId: string }>();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDispute() {
      const disputeSnapshot = await getDoc(doc(db, "disputes", params.disputeId));
      const loadedDispute = disputeSnapshot.exists()
        ? ({ ...(disputeSnapshot.data() as Dispute), id: disputeSnapshot.id })
        : null;

      setDispute(loadedDispute);

      if (loadedDispute?.dealId) {
        const dealSnapshot = await getDoc(doc(db, "deals", loadedDispute.dealId));
        const loadedDeal = dealSnapshot.exists()
          ? ({ ...(dealSnapshot.data() as Deal), id: dealSnapshot.id })
          : null;
        setDeal(loadedDeal);

        const sourceIds = [loadedDispute.dealId, loadedDeal?.sourceId].filter(Boolean) as string[];
        const messageSnapshots = await Promise.all(
          sourceIds.map((sourceId) =>
            getDocs(query(collection(db, "messages"), where("sourceId", "==", sourceId))),
          ),
        );

        setMessages(
          messageSnapshots
            .flatMap((snapshot) =>
              snapshot.docs.map((item) => ({ ...(item.data() as ChatMessage), id: item.id })),
            )
            .sort((a, b) => timeValue(a.createdAt) - timeValue(b.createdAt)),
        );
      }

      setLoading(false);
    }

    void loadDispute();
  }, [params.disputeId]);

  async function resolveDispute(status: Dispute["status"]) {
    if (!dispute) return;

    await updateDoc(doc(db, "disputes", dispute.id), {
      adminNote: note,
      status,
      updatedAt: serverTimestamp(),
    });
    setDispute({ ...dispute, status });
    setNote("");
  }

  return (
    <AdminShell
      subtitle="Prüfe Grund, Deal-Kontext und relevante Nachrichten."
      title="Streitfall öffnen"
    >
      {loading ? (
        <p className="premium-panel rounded-lg p-6 text-sm text-zinc-500">Streitfall wird geladen...</p>
      ) : null}

      {!loading && !dispute ? (
        <p className="premium-panel rounded-lg p-6 text-sm text-zinc-500">Streitfall nicht gefunden.</p>
      ) : null}

      {dispute ? (
        <div className="grid gap-6">
          <section className="premium-panel grid gap-4 rounded-lg p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="premium-kicker">Streitfall</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">{dispute.title || "Streitfall"}</h2>
                <p className="mt-2 text-sm text-zinc-500">
                  {dispute.creatorName || "-"} · {dispute.companyName || "-"}
                </p>
              </div>
              <StatusBadge status={dispute.status} />
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-black text-red-800">Grund</p>
              <p className="mt-2 text-sm leading-6 text-red-700">{dispute.reason || "Kein Grund angegeben."}</p>
            </div>
          </section>

          {deal ? (
            <section className="premium-panel grid gap-3 rounded-lg p-6">
              <p className="premium-kicker">Deal</p>
              <h3 className="text-2xl font-black">{deal.service || deal.campaignTitle || "Kooperation"}</h3>
              <dl className="grid gap-3 text-sm sm:grid-cols-3">
                <div><dt className="text-zinc-500">Status</dt><dd className="font-semibold">{deal.status}</dd></div>
                <div><dt className="text-zinc-500">Preis</dt><dd className="font-semibold">{Number(deal.price || 0).toLocaleString("de-DE")} EUR</dd></div>
                <div><dt className="text-zinc-500">Creator Auszahlung</dt><dd className="font-semibold">{Number(deal.creatorPayout ?? Number(deal.price || 0) * 0.85).toLocaleString("de-DE")} EUR</dd></div>
              </dl>
            </section>
          ) : null}

          <section className="premium-panel grid gap-3 rounded-lg p-6">
            <p className="premium-kicker">Nachrichten</p>
            <h3 className="text-2xl font-black">Relevanter Chat</h3>
            <div className="grid max-h-[520px] gap-3 overflow-y-auto rounded-lg bg-zinc-50 p-3">
              {messages.map((message) => (
                <article className="rounded-lg border border-zinc-200 bg-white p-3" key={message.id}>
                  <p className="text-sm font-black">{message.senderName || message.senderId}</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-700">{message.body}</p>
                </article>
              ))}
              {messages.length === 0 ? (
                <p className="text-sm text-zinc-500">Keine Nachrichten gefunden.</p>
              ) : null}
            </div>
          </section>

          <section className="premium-panel grid gap-3 rounded-lg p-6">
            <TextAreaField label="Interne Admin-Notiz" value={note} onChange={(event) => setNote(event.target.value)} />
            <div className="flex flex-wrap gap-2">
              <button className="premium-button rounded-lg px-4 py-2.5 text-sm font-black" onClick={() => void resolveDispute("resolved")} type="button">
                Als gelöst markieren
              </button>
              <button className="premium-button-secondary rounded-lg px-4 py-2.5 text-sm font-black" onClick={() => void resolveDispute("in_review")} type="button">
                In Prüfung
              </button>
              <button className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-black text-red-700" onClick={() => void resolveDispute("rejected")} type="button">
                Ablehnen
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </AdminShell>
  );
}
