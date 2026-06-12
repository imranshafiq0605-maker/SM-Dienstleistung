"use client";

import { addDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  AdminSection,
  AdminStatCard,
  EmptyState,
  StatusBadge,
} from "@/components/admin/admin-ui";
import { SelectField, TextAreaField, TextField } from "@/components/ui/form-field";
import { db } from "@/lib/firebase";
import type {
  AdminNote,
  BlacklistEntry,
  PlatformCategory,
  UserRole,
} from "@/types/creatorflow";

const defaultCategories = [
  "Beauty",
  "Fashion",
  "Fitness",
  "Gaming",
  "Lifestyle",
  "Food",
  "Travel",
  "Business",
  "Tech",
  "UGC",
];

export default function AdminSettingsPage() {
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [categories, setCategories] = useState<PlatformCategory[]>([]);
  const [blacklistForm, setBlacklistForm] = useState({
    reason: "",
    targetId: "",
    targetType: "creator" as UserRole | "campaign" | "deal",
  });
  const [noteForm, setNoteForm] = useState({
    note: "",
    targetId: "",
    targetType: "creator" as UserRole | "campaign" | "deal",
  });
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    let mounted = true;

    Promise.all([
      getDocs(collection(db, "blacklist")),
      getDocs(collection(db, "adminNotes")),
      getDocs(collection(db, "platformCategories")),
    ]).then(([blacklistSnapshot, notesSnapshot, categoriesSnapshot]) => {
      if (!mounted) return;

      setBlacklist(
        blacklistSnapshot.docs.map((item) => ({
          ...(item.data() as BlacklistEntry),
          id: item.id,
        })),
      );
      setNotes(
        notesSnapshot.docs.map((item) => ({
          ...(item.data() as AdminNote),
          id: item.id,
        })),
      );
      setCategories(
        categoriesSnapshot.docs.map((item) => ({
          ...(item.data() as PlatformCategory),
          id: item.id,
        })),
      );
    });

    return () => {
      mounted = false;
    };
  }, []);

  async function addBlacklistEntry() {
    if (!blacklistForm.targetId || !blacklistForm.reason) return;

    const payload = {
      ...blacklistForm,
      createdAt: serverTimestamp(),
    };
    const item = await addDoc(collection(db, "blacklist"), payload);
    setBlacklist((current) => [
      { ...blacklistForm, createdAt: null, id: item.id },
      ...current,
    ]);
    setBlacklistForm({ reason: "", targetId: "", targetType: "creator" });
  }

  async function addAdminNote() {
    if (!noteForm.targetId || !noteForm.note) return;

    const payload = {
      ...noteForm,
      createdAt: serverTimestamp(),
    };
    const item = await addDoc(collection(db, "adminNotes"), payload);
    setNotes((current) => [{ ...noteForm, createdAt: null, id: item.id }, ...current]);
    setNoteForm({ note: "", targetId: "", targetType: "creator" });
  }

  async function addCategory() {
    const name = categoryName.trim();
    if (!name) return;

    const payload = {
      active: true,
      createdAt: serverTimestamp(),
      name,
    };
    const item = await addDoc(collection(db, "platformCategories"), payload);
    setCategories((current) => [
      { active: true, createdAt: null, id: item.id, name },
      ...current,
    ]);
    setCategoryName("");
  }

  const visibleCategories =
    categories.length > 0
      ? categories
      : defaultCategories.map((name) => ({
          active: true,
          createdAt: null,
          id: name,
          name,
        }));

  return (
    <AdminShell
      subtitle="Verwalte Blacklist, Kategorien und interne Notizen für operative Entscheidungen."
      title="Admin Settings"
    >
      <section className="grid gap-4 md:grid-cols-3">
        <AdminStatCard
          detail="Gesperrte IDs"
          label="Blacklist"
          value={blacklist.length}
        />
        <AdminStatCard
          detail="Aktive Kategorien"
          label="Kategorien"
          value={visibleCategories.length}
        />
        <AdminStatCard
          detail="Interne Admin-Hinweise"
          label="Notizen"
          value={notes.length}
        />
      </section>

      <AdminSection eyebrow="Blacklist" title="Blacklist verwalten">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
          <TextField
            label="Ziel-ID"
            onChange={(event) =>
              setBlacklistForm((current) => ({
                ...current,
                targetId: event.target.value,
              }))
            }
            value={blacklistForm.targetId}
          />
          <SelectField
            label="Typ"
            onChange={(event) =>
              setBlacklistForm((current) => ({
                ...current,
                targetType: event.target.value as typeof blacklistForm.targetType,
              }))
            }
            value={blacklistForm.targetType}
          >
            <option value="creator">Creator</option>
            <option value="company">Unternehmen</option>
            <option value="campaign">Kampagne</option>
            <option value="deal">Deal</option>
          </SelectField>
          <TextField
            label="Grund"
            onChange={(event) =>
              setBlacklistForm((current) => ({
                ...current,
                reason: event.target.value,
              }))
            }
            value={blacklistForm.reason}
          />
          <button
            className="premium-button rounded-lg px-4 py-3 text-sm font-semibold"
            onClick={() => void addBlacklistEntry()}
            type="button"
          >
            Hinzufuegen
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          {blacklist.length === 0 ? (
            <EmptyState
              text="Gesperrte Nutzer, Kampagnen oder Deals erscheinen nach dem Hinzufuegen hier."
              title="Blacklist ist leer"
            />
          ) : (
            blacklist.map((entry) => (
              <div
                className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between"
                key={entry.id}
              >
                <div>
                  <p className="font-semibold text-zinc-950">{entry.targetId}</p>
                  <p className="mt-1 text-sm text-zinc-500">{entry.reason}</p>
                </div>
                <StatusBadge status={entry.targetType} />
              </div>
            ))
          )}
        </div>
      </AdminSection>

      <AdminSection eyebrow="Kategorien" title="Kategorien verwalten">
        <div className="flex flex-col gap-3 sm:flex-row">
          <TextField
            label="Neue Kategorie"
            onChange={(event) => setCategoryName(event.target.value)}
            value={categoryName}
          />
          <button
            className="premium-button mt-auto rounded-lg px-4 py-3 text-sm font-semibold"
            onClick={() => void addCategory()}
            type="button"
          >
            Speichern
          </button>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {visibleCategories.map((category) => (
            <span
              className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-700"
              key={category.id}
            >
              {category.name}
            </span>
          ))}
        </div>
      </AdminSection>

      <AdminSection eyebrow="Notizen" title="Interne Notizen">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Ziel-ID"
            onChange={(event) =>
              setNoteForm((current) => ({ ...current, targetId: event.target.value }))
            }
            value={noteForm.targetId}
          />
          <SelectField
            label="Typ"
            onChange={(event) =>
              setNoteForm((current) => ({
                ...current,
                targetType: event.target.value as typeof noteForm.targetType,
              }))
            }
            value={noteForm.targetType}
          >
            <option value="creator">Creator</option>
            <option value="company">Unternehmen</option>
            <option value="campaign">Kampagne</option>
            <option value="deal">Deal</option>
          </SelectField>
        </div>
        <div className="mt-4">
          <TextAreaField
            label="Notiz"
            onChange={(event) =>
              setNoteForm((current) => ({ ...current, note: event.target.value }))
            }
            value={noteForm.note}
          />
        </div>
        <button
          className="premium-button mt-4 rounded-lg px-4 py-3 text-sm font-semibold"
          onClick={() => void addAdminNote()}
          type="button"
        >
          Notiz speichern
        </button>

        <div className="mt-5 grid gap-3">
          {notes.length === 0 ? (
            <EmptyState
              text="Interne Hinweise für Nutzer, Kampagnen oder Deals werden hier gesammelt."
              title="Noch keine Notizen"
            />
          ) : (
            notes.map((note) => (
              <article
                className="rounded-lg border border-zinc-200 bg-white/80 p-4"
                key={note.id}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-zinc-950">{note.targetId}</p>
                  <StatusBadge status={note.targetType} />
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{note.note}</p>
              </article>
            ))
          )}
        </div>
      </AdminSection>
    </AdminShell>
  );
}
