"use client";

import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { FileUploadField, SelectField, TextAreaField, TextField } from "@/components/ui/form-field";
import { db } from "@/lib/firebase";
import { uploadProfileFiles } from "@/lib/storage-upload";
import type { ContentSubmission, Deal, DealStatus, FirestoreDate, UserRole } from "@/types/creatorflow";

function timeValue(value: FirestoreDate) {
  if (!value) return 0;
  if ("toMillis" in value) return value.toMillis();
  return value.getTime();
}

function isImage(fileName: string) {
  return /\.(avif|gif|jpe?g|png|webp)$/i.test(fileName);
}

function isVideo(fileName: string) {
  return /\.(mov|mp4|mpeg|mpg|webm)$/i.test(fileName);
}

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
  { value: "revision", label: "Überarbeitung" },
  { value: "approved", label: "Freigegeben" },
  { value: "published", label: "Veröffentlicht" },
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
  const [submissions, setSubmissions] = useState<ContentSubmission[]>([]);
  const [contentForm, setContentForm] = useState({ caption: "", postLink: "" });
  const [contentFiles, setContentFiles] = useState<FileList | null>(null);
  const [feedback, setFeedback] = useState("");
  const [review, setReview] = useState(initialReview);
  const [notice, setNotice] = useState("");
  const [uploadingContent, setUploadingContent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [contentError, setContentError] = useState("");

  useEffect(() => {
    const unsubscribeDeal = onSnapshot(
      doc(db, "deals", dealId),
      (snapshot) => {
        setDeal(snapshot.exists() ? ({ ...(snapshot.data() as Deal), id: snapshot.id }) : null);
        setLoading(false);
      },
      (dealError) => {
        setError(dealError.message || "Deal konnte nicht geladen werden.");
        setLoading(false);
      },
    );

    const unsubscribeSubmissions = onSnapshot(
      query(collection(db, "contentSubmissions"), where("dealId", "==", dealId)),
      (snapshot) => {
        setSubmissions(
          snapshot.docs
            .map((submissionDoc) => ({ ...(submissionDoc.data() as ContentSubmission), id: submissionDoc.id }))
            .sort((a, b) => timeValue(b.createdAt) - timeValue(a.createdAt)),
        );
      },
      (submissionError) => {
        setError(submissionError.message || "Content konnte nicht geladen werden.");
      },
    );

    return () => {
      unsubscribeDeal();
      unsubscribeSubmissions();
    };
  }, [dealId]);

  async function submitContent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!appUser || !deal) return;

    if (appUser.uid !== deal.creatorId) {
      setContentError("Nur der Creator dieses Deals kann Content hochladen.");
      return;
    }

    if (!contentFiles?.length && !contentForm.caption.trim() && !contentForm.postLink.trim()) {
      setContentError("Bitte lade mindestens eine Datei hoch oder ergänze Caption/Post-Link.");
      return;
    }

    setUploadingContent(true);
    setContentError("");
    setNotice("");

    try {
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
    } catch (uploadError) {
      setContentError(
        uploadError instanceof Error
          ? uploadError.message
          : "Content konnte nicht hochgeladen werden.",
      );
    } finally {
      setUploadingContent(false);
    }
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
  }

  async function updateDealStatus(status: DealStatus) {
    await updateDoc(doc(db, "deals", dealId), {
      status,
      updatedAt: serverTimestamp(),
    });
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

  if (loading) {
    return (
      <section className="premium-panel rounded-lg p-6">
        <p className="text-sm text-zinc-500">Deal wird geladen...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-sm font-semibold text-red-700">Deal konnte nicht geladen werden.</p>
        <p className="mt-2 text-sm text-red-600">{error}</p>
      </section>
    );
  }

  if (!deal) {
    return (
      <section className="premium-panel rounded-lg p-6">
        <p className="text-sm font-semibold text-zinc-700">Deal nicht gefunden.</p>
        <p className="mt-2 text-sm text-zinc-500">
          Dieser Deal existiert nicht mehr oder du hast keinen Zugriff darauf.
        </p>
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
        <h2 className="text-2xl font-semibold">Content Workflow</h2>
        {role === "creator" ? (
          <form className="grid gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4" onSubmit={(event) => void submitContent(event)}>
            <TextAreaField label="Caption" value={contentForm.caption} onChange={(event) => setContentForm((current) => ({ ...current, caption: event.target.value }))} />
            <TextField label="Post-Link" value={contentForm.postLink} onChange={(event) => setContentForm((current) => ({ ...current, postLink: event.target.value }))} />
            <FileUploadField accept="image/*,video/*" files={contentFiles} label="Mehrere Bilder oder Videos" onChange={setContentFiles} />
            {contentError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                {contentError}
              </p>
            ) : null}
            <button className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white disabled:bg-zinc-400" disabled={uploadingContent} type="submit">
              {uploadingContent ? "Content wird hochgeladen..." : "Content hochladen"}
            </button>
          </form>
        ) : null}

        <div className="grid gap-3">
          {submissions.length === 0 ? (
            <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
              Noch kein Content hochgeladen.
            </p>
          ) : null}
          {submissions.map((submission) => (
            <article className="grid gap-3 rounded-lg border border-zinc-200 p-4" key={submission.id}>
              <p className="font-semibold">Status: {submission.status}</p>
              <p className="text-sm text-zinc-600">{submission.caption || "Keine Caption"}</p>
              {submission.postLink ? <a className="text-sm font-medium underline" href={submission.postLink} rel="noreferrer" target="_blank">Post-Link öffnen</a> : null}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {submission.files?.map((file) => (
                  <a className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm" href={file.url} key={file.path} rel="noreferrer" target="_blank">
                    {isImage(file.name) ? (
                      <img alt={file.name} className="aspect-video w-full object-cover" src={file.url} />
                    ) : null}
                    {isVideo(file.name) ? (
                      <video className="aspect-video w-full object-cover" controls preload="metadata" src={file.url} />
                    ) : null}
                    {!isImage(file.name) && !isVideo(file.name) ? (
                      <div className="grid aspect-video place-items-center bg-zinc-50 px-3 text-center text-sm font-semibold text-zinc-500">
                        Datei
                      </div>
                    ) : null}
                    <span className="block truncate px-3 py-2 text-sm font-semibold text-zinc-700">
                      {file.name}
                    </span>
                  </a>
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
            <TextField label={role === "company" ? "Qualität" : "Kommunikation"} max="5" min="1" type="number" value={review.first} onChange={(event) => setReview((current) => ({ ...current, first: event.target.value }))} />
            <TextField label={role === "company" ? "Kommunikation" : "Zahlungsabwicklung"} max="5" min="1" type="number" value={review.second} onChange={(event) => setReview((current) => ({ ...current, second: event.target.value }))} />
            <TextField label={role === "company" ? "Pünktlichkeit" : "Briefing Klarheit"} max="5" min="1" type="number" value={review.third} onChange={(event) => setReview((current) => ({ ...current, third: event.target.value }))} />
            <TextField label={role === "company" ? "Briefing eingehalten" : "Fairness"} max="5" min="1" type="number" value={review.fourth} onChange={(event) => setReview((current) => ({ ...current, fourth: event.target.value }))} />
          </div>
          <TextAreaField label="Notiz" value={review.note} onChange={(event) => setReview((current) => ({ ...current, note: event.target.value }))} />
          <button className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white" type="submit">Bewertung speichern</button>
        </form>
      </section>
    </div>
  );
}
