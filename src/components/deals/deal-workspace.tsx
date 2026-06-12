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
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { SelectField, TextAreaField, TextField } from "@/components/ui/form-field";
import { db } from "@/lib/firebase";
import { uploadProfileFiles } from "@/lib/storage-upload";
import type { ChatMessage, ContentSubmission, Deal, DealStatus, UserRole } from "@/types/creatorflow";

const dealStatusOptions: { value: DealStatus; label: string }[] = [
  { value: "contract_open", label: "Vertrag offen" },
  { value: "payment_open", label: "Zahlung offen" },
  { value: "payment_received", label: "Zahlung eingegangen" },
  { value: "shipping_open", label: "Produktversand offen" },
  { value: "product_shipped", label: "Produkt versendet" },
  { value: "product_arrived", label: "Produkt angekommen" },
  { value: "content_in_progress", label: "Content in Arbeit" },
  { value: "content_uploaded", label: "Content hochgeladen" },
  { value: "feedback_open", label: "Feedback offen" },
  { value: "revision", label: "Ueberarbeitung" },
  { value: "approved", label: "Freigegeben" },
  { value: "published", label: "Veroeffentlicht" },
  { value: "completed", label: "Abgeschlossen" },
  { value: "payout_open", label: "Auszahlung offen" },
  { value: "paid_out", label: "Ausgezahlt" },
  { value: "dispute", label: "Streitfall" },
];

const initialReview = {
  first: "5",
  second: "5",
  third: "5",
  fourth: "5",
  note: "",
};

export function DealWorkspace({ dealId, role }: { dealId: string; role: Extract<UserRole, "creator" | "company"> }) {
  const { appUser } = useAuth();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [submissions, setSubmissions] = useState<ContentSubmission[]>([]);
  const [messageBody, setMessageBody] = useState("");
  const [messageFiles, setMessageFiles] = useState<FileList | null>(null);
  const [contentForm, setContentForm] = useState({ caption: "", postLink: "" });
  const [contentFiles, setContentFiles] = useState<FileList | null>(null);
  const [feedback, setFeedback] = useState("");
  const [review, setReview] = useState(initialReview);
  const [notice, setNotice] = useState("");

  async function loadWorkspace() {
    const [dealSnapshot, messagesSnapshot, submissionsSnapshot] = await Promise.all([
      getDoc(doc(db, "deals", dealId)),
      getDocs(query(collection(db, "messages"), where("conversationId", "==", `deal_${dealId}`), orderBy("createdAt", "asc"))),
      getDocs(query(collection(db, "contentSubmissions"), where("dealId", "==", dealId))),
    ]);

    setDeal(dealSnapshot.exists() ? ({ ...(dealSnapshot.data() as Deal), id: dealSnapshot.id }) : null);
    setMessages(messagesSnapshot.docs.map((messageDoc) => ({ ...(messageDoc.data() as ChatMessage), id: messageDoc.id })));
    setSubmissions(submissionsSnapshot.docs.map((submissionDoc) => ({ ...(submissionDoc.data() as ContentSubmission), id: submissionDoc.id })));
  }

  useEffect(() => {
    let mounted = true;

    Promise.all([
      getDoc(doc(db, "deals", dealId)),
      getDocs(query(collection(db, "messages"), where("conversationId", "==", `deal_${dealId}`), orderBy("createdAt", "asc"))),
      getDocs(query(collection(db, "contentSubmissions"), where("dealId", "==", dealId))),
    ]).then(([dealSnapshot, messagesSnapshot, submissionsSnapshot]) => {
      if (!mounted) return;

      setDeal(dealSnapshot.exists() ? ({ ...(dealSnapshot.data() as Deal), id: dealSnapshot.id }) : null);
      setMessages(messagesSnapshot.docs.map((messageDoc) => ({ ...(messageDoc.data() as ChatMessage), id: messageDoc.id })));
      setSubmissions(submissionsSnapshot.docs.map((submissionDoc) => ({ ...(submissionDoc.data() as ContentSubmission), id: submissionDoc.id })));
    });

    return () => {
      mounted = false;
    };
  }, [dealId]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!appUser || !messageBody.trim()) return;

    const attachments = await uploadProfileFiles(messageFiles, `conversations/deal_${dealId}`);
    await addDoc(collection(db, "messages"), {
      conversationId: `deal_${dealId}`,
      sourceType: "deal",
      sourceId: dealId,
      senderId: appUser.uid,
      senderName: appUser.displayName,
      body: messageBody,
      attachments,
      readBy: [appUser.uid],
      createdAt: serverTimestamp(),
    });
    setMessageBody("");
    setMessageFiles(null);
    await loadWorkspace();
  }

  async function markMessagesRead() {
    if (!appUser) return;

    await Promise.all(
      messages
        .filter((message) => !message.readBy?.includes(appUser.uid))
        .map((message) =>
          updateDoc(doc(db, "messages", message.id), {
            readBy: [...(message.readBy ?? []), appUser.uid],
          }),
        ),
    );
    await loadWorkspace();
  }

  async function submitContent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!appUser || !deal) return;

    const files = await uploadProfileFiles(contentFiles, `deals/${dealId}/content`);
    await addDoc(collection(db, "contentSubmissions"), {
      dealId,
      creatorId: deal.creatorId,
      companyId: deal.companyId,
      caption: contentForm.caption,
      postLink: contentForm.postLink,
      files,
      status: "uploaded",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "deals", dealId), {
      status: "content_uploaded",
      updatedAt: serverTimestamp(),
    });
    setContentForm({ caption: "", postLink: "" });
    setContentFiles(null);
    setNotice("Content wurde hochgeladen.");
    await loadWorkspace();
  }

  async function updateSubmission(submission: ContentSubmission, status: ContentSubmission["status"]) {
    await updateDoc(doc(db, "contentSubmissions", submission.id), {
      status,
      feedback,
      updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "deals", dealId), {
      status: status === "approved" ? "approved" : "revision",
      updatedAt: serverTimestamp(),
    });
    setFeedback("");
    await loadWorkspace();
  }

  async function updateDealStatus(status: DealStatus) {
    await updateDoc(doc(db, "deals", dealId), {
      status,
      updatedAt: serverTimestamp(),
    });
    await loadWorkspace();
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!deal) return;

    if (role === "company") {
      await addDoc(collection(db, "creatorReviews"), {
        dealId,
        creatorId: deal.creatorId,
        companyId: deal.companyId,
        quality: Number(review.first),
        communication: Number(review.second),
        punctuality: Number(review.third),
        briefingFollowed: Number(review.fourth),
        note: review.note,
        createdAt: serverTimestamp(),
      });
    } else {
      await addDoc(collection(db, "companyReviews"), {
        dealId,
        creatorId: deal.creatorId,
        companyId: deal.companyId,
        communication: Number(review.first),
        paymentProcess: Number(review.second),
        briefingClarity: Number(review.third),
        fairness: Number(review.fourth),
        note: review.note,
        createdAt: serverTimestamp(),
      });
    }

    setReview(initialReview);
    setNotice("Bewertung gespeichert.");
  }

  if (!deal) {
    return (
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-500">Deal wird geladen...</p>
      </section>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Deal</p>
            <h2 className="mt-2 text-2xl font-semibold">{deal.service || deal.campaignTitle}</h2>
            <p className="mt-1 text-sm text-zinc-500">{deal.creatorName} und {deal.companyName}</p>
          </div>
          <SelectField label="Deal Status" value={deal.status} onChange={(event) => void updateDealStatus(event.target.value as DealStatus)}>
            {dealStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </SelectField>
        </div>
        {notice ? <p className="text-sm font-medium text-green-700">{notice}</p> : null}
      </section>

      <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Chat</h2>
          <button className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold" onClick={() => void markMessagesRead()} type="button">
            Als gelesen markieren
          </button>
        </div>
        <div className="grid max-h-96 gap-3 overflow-y-auto rounded-lg bg-zinc-50 p-3">
          {messages.map((message) => (
            <article className="rounded-lg border border-zinc-200 bg-white p-3" key={message.id}>
              <p className="text-sm font-semibold">{message.senderName}</p>
              <p className="mt-1 text-sm text-zinc-700">{message.body}</p>
              <p className="mt-2 text-xs text-zinc-500">Gelesen von {message.readBy?.length ?? 0} Nutzer(n)</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {message.attachments?.map((file) => (
                  <a className="text-xs font-medium underline" href={file.url} key={file.path} rel="noreferrer" target="_blank">{file.name}</a>
                ))}
              </div>
            </article>
          ))}
          {messages.length === 0 ? <p className="text-sm text-zinc-500">Noch keine Nachrichten.</p> : null}
        </div>
        <form className="grid gap-3" onSubmit={(event) => void sendMessage(event)}>
          <TextAreaField label="Nachricht" value={messageBody} onChange={(event) => setMessageBody(event.target.value)} />
          <input multiple onChange={(event: ChangeEvent<HTMLInputElement>) => setMessageFiles(event.target.files)} type="file" />
          <button className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white" type="submit">Nachricht senden</button>
        </form>
      </section>

      <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Content Workflow</h2>
        {role === "creator" ? (
          <form className="grid gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4" onSubmit={(event) => void submitContent(event)}>
            <TextAreaField label="Caption" value={contentForm.caption} onChange={(event) => setContentForm((current) => ({ ...current, caption: event.target.value }))} />
            <TextField label="Post-Link" value={contentForm.postLink} onChange={(event) => setContentForm((current) => ({ ...current, postLink: event.target.value }))} />
            <label className="grid gap-2 text-sm font-medium text-zinc-700">Video, Bild oder Dateien<input multiple onChange={(event) => setContentFiles(event.target.files)} type="file" /></label>
            <button className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white" type="submit">Content hochladen</button>
          </form>
        ) : null}

        <div className="grid gap-3">
          {submissions.map((submission) => (
            <article className="grid gap-3 rounded-lg border border-zinc-200 p-4" key={submission.id}>
              <p className="font-semibold">Status: {submission.status}</p>
              <p className="text-sm text-zinc-600">{submission.caption || "Keine Caption"}</p>
              {submission.postLink ? <a className="text-sm font-medium underline" href={submission.postLink} rel="noreferrer" target="_blank">Post-Link oeffnen</a> : null}
              <div className="flex flex-wrap gap-2">
                {submission.files?.map((file) => (
                  <a className="rounded-full border border-zinc-300 px-3 py-2 text-sm font-medium" href={file.url} key={file.path} rel="noreferrer" target="_blank">{file.name}</a>
                ))}
              </div>
              {submission.feedback ? <p className="text-sm text-zinc-600">Feedback: {submission.feedback}</p> : null}
              {role === "company" ? (
                <div className="grid gap-3">
                  <TextAreaField label="Feedback" value={feedback} onChange={(event) => setFeedback(event.target.value)} />
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white" onClick={() => void updateSubmission(submission, "approved")} type="button">Freigeben</button>
                    <button className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold" onClick={() => void updateSubmission(submission, "revision_requested")} type="button">Revision verlangen</button>
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Bewertung</h2>
        <form className="grid gap-4" onSubmit={(event) => void submitReview(event)}>
          <div className="grid gap-4 sm:grid-cols-4">
            <TextField label={role === "company" ? "Qualitaet" : "Kommunikation"} max="5" min="1" type="number" value={review.first} onChange={(event) => setReview((current) => ({ ...current, first: event.target.value }))} />
            <TextField label={role === "company" ? "Kommunikation" : "Zahlungsabwicklung"} max="5" min="1" type="number" value={review.second} onChange={(event) => setReview((current) => ({ ...current, second: event.target.value }))} />
            <TextField label={role === "company" ? "Puenktlichkeit" : "Briefing Klarheit"} max="5" min="1" type="number" value={review.third} onChange={(event) => setReview((current) => ({ ...current, third: event.target.value }))} />
            <TextField label={role === "company" ? "Briefing eingehalten" : "Fairness"} max="5" min="1" type="number" value={review.fourth} onChange={(event) => setReview((current) => ({ ...current, fourth: event.target.value }))} />
          </div>
          <TextAreaField label="Notiz" value={review.note} onChange={(event) => setReview((current) => ({ ...current, note: event.target.value }))} />
          <button className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white" type="submit">Bewertung speichern</button>
        </form>
      </section>
    </div>
  );
}
