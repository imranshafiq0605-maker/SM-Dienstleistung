"use client";

import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { ProtectedPage } from "@/components/auth/protected-page";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SelectField, TextAreaField, TextField } from "@/components/ui/form-field";
import { db } from "@/lib/firebase";
import type {
  AdminNote,
  AppUser,
  BlacklistEntry,
  Campaign,
  CreatorProfile,
  CompanyProfile,
  Deal,
  PendingUser,
  UserRole,
  UserStatus,
} from "@/types/creatorflow";

export default function AdminDashboardPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [blacklistForm, setBlacklistForm] = useState({
    targetId: "",
    targetType: "creator" as UserRole | "campaign" | "deal",
    reason: "",
  });
  const [noteForm, setNoteForm] = useState({
    targetId: "",
    targetType: "creator" as UserRole | "campaign" | "deal",
    note: "",
  });

  const loadPendingUsers = useCallback(async () => {
    const usersQuery = query(
      collection(db, "users"),
      where("status", "==", "pending"),
    );
    const snapshot = await getDocs(usersQuery);
    const users = snapshot.docs.map((userDoc) => {
      const user = userDoc.data() as AppUser;

      return {
        ...user,
        profileLabel:
          user.role === "company" ? "Unternehmen pruefen" : "Creator pruefen",
      };
    });

    setPendingUsers(users);
    setLoadingUsers(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    const usersQuery = query(
      collection(db, "users"),
      where("status", "==", "pending"),
    );

    getDocs(usersQuery).then((snapshot) => {
      if (!mounted) return;

      const users = snapshot.docs.map((userDoc) => {
        const user = userDoc.data() as AppUser;

        return {
          ...user,
          profileLabel:
            user.role === "company" ? "Unternehmen pruefen" : "Creator pruefen",
        };
      });

      setPendingUsers(users);
      setLoadingUsers(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    async function loadAdminData() {
      const [
        creatorsSnapshot,
        companiesSnapshot,
        campaignsSnapshot,
        dealsSnapshot,
        blacklistSnapshot,
        notesSnapshot,
      ] = await Promise.all([
        getDocs(collection(db, "creatorProfiles")),
        getDocs(collection(db, "companyProfiles")),
        getDocs(collection(db, "campaigns")),
        getDocs(collection(db, "deals")),
        getDocs(collection(db, "blacklist")),
        getDocs(collection(db, "adminNotes")),
      ]);

      setCreators(creatorsSnapshot.docs.map((item) => item.data() as CreatorProfile));
      setCompanies(companiesSnapshot.docs.map((item) => item.data() as CompanyProfile));
      setCampaigns(campaignsSnapshot.docs.map((item) => ({ ...(item.data() as Campaign), id: item.id })));
      setDeals(dealsSnapshot.docs.map((item) => ({ ...(item.data() as Deal), id: item.id })));
      setBlacklist(blacklistSnapshot.docs.map((item) => ({ ...(item.data() as BlacklistEntry), id: item.id })));
      setNotes(notesSnapshot.docs.map((item) => ({ ...(item.data() as AdminNote), id: item.id })));
    }

    void loadAdminData();
  }, []);

  async function updateUserStatus(uid: string, role: string, status: UserStatus) {
    setUpdatingUid(uid);

    await updateDoc(doc(db, "users", uid), {
      status,
      reviewedAt: serverTimestamp(),
    });

    if (role === "creator") {
      await updateDoc(doc(db, "creatorProfiles", uid), { status });
    }

    if (role === "company") {
      await updateDoc(doc(db, "companyProfiles", uid), { status });
    }

    await loadPendingUsers();
    setUpdatingUid(null);
  }

  async function updateProfileStatus(
    uid: string,
    role: Extract<UserRole, "creator" | "company">,
    status: UserStatus,
  ) {
    await updateDoc(doc(db, "users", uid), { status, updatedAt: serverTimestamp() });
    await updateDoc(doc(db, role === "creator" ? "creatorProfiles" : "companyProfiles", uid), {
      status,
      updatedAt: serverTimestamp(),
    });
  }

  async function updateCampaignStatus(campaignId: string, status: Campaign["status"]) {
    await updateDoc(doc(db, "campaigns", campaignId), {
      status,
      updatedAt: serverTimestamp(),
    });
  }

  async function addBlacklistEntry() {
    await addDoc(collection(db, "blacklist"), {
      ...blacklistForm,
      createdAt: serverTimestamp(),
    });
    setBlacklistForm({ targetId: "", targetType: "creator", reason: "" });
  }

  async function addAdminNote() {
    await addDoc(collection(db, "adminNotes"), {
      ...noteForm,
      createdAt: serverTimestamp(),
    });
    setNoteForm({ targetId: "", targetType: "creator", note: "" });
  }

  return (
    <ProtectedPage role="admin">
      <DashboardShell title="Admin Dashboard">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Creator", creators.length],
            ["Unternehmen", companies.length],
            ["Kampagnen", campaigns.length],
            ["Deals", deals.length],
            ["Streitfaelle", deals.filter((deal) => deal.status === "dispute").length],
            ["Blacklist", blacklist.length],
            ["Notizen", notes.length],
            ["Offene Freigaben", pendingUsers.length],
          ].map(([label, value]) => (
            <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm" key={label}>
              <p className="text-sm font-medium text-zinc-500">{label}</p>
              <p className="mt-2 text-3xl font-semibold">{value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
                Freigaben
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Pending Nutzer
              </h2>
            </div>
            <button
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold"
              onClick={() => void loadPendingUsers()}
              type="button"
            >
              Aktualisieren
            </button>
          </div>

          <div className="mt-6 grid gap-3">
            {loadingUsers ? (
              <p className="text-sm text-zinc-500">Lade Nutzer...</p>
            ) : null}

            {!loadingUsers && pendingUsers.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Keine offenen Freigaben vorhanden.
              </p>
            ) : null}

            {pendingUsers.map((user) => (
              <article
                className="grid gap-4 rounded-lg border border-zinc-200 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                key={user.uid}
              >
                <div>
                  <p className="font-semibold">{user.displayName}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {user.email} · {user.role} · {user.profileLabel}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white disabled:bg-zinc-400"
                    disabled={updatingUid === user.uid}
                    onClick={() =>
                      void updateUserStatus(user.uid, user.role, "active")
                    }
                    type="button"
                  >
                    Freigeben
                  </button>
                  <button
                    className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 disabled:text-zinc-400"
                    disabled={updatingUid === user.uid}
                    onClick={() =>
                      void updateUserStatus(user.uid, user.role, "rejected")
                    }
                    type="button"
                  >
                    Ablehnen
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Creator bearbeiten</h2>
          {creators.slice(0, 8).map((creator) => (
            <article className="grid gap-3 rounded-lg border border-zinc-200 p-4 sm:grid-cols-[1fr_auto] sm:items-center" key={creator.uid}>
              <div>
                <p className="font-semibold">{creator.artistName || `${creator.firstName} ${creator.lastName}`}</p>
                <p className="text-sm text-zinc-500">{creator.email} · {creator.status}</p>
              </div>
              <div className="flex gap-2">
                <button className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white" onClick={() => void updateProfileStatus(creator.uid, "creator", "active")} type="button">Aktiv</button>
                <button className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold" onClick={() => void updateProfileStatus(creator.uid, "creator", "rejected")} type="button">Sperren</button>
              </div>
            </article>
          ))}
        </section>

        <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Unternehmen bearbeiten</h2>
          {companies.slice(0, 8).map((company) => (
            <article className="grid gap-3 rounded-lg border border-zinc-200 p-4 sm:grid-cols-[1fr_auto] sm:items-center" key={company.uid}>
              <div>
                <p className="font-semibold">{company.companyName}</p>
                <p className="text-sm text-zinc-500">{company.email} · {company.status}</p>
              </div>
              <div className="flex gap-2">
                <button className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white" onClick={() => void updateProfileStatus(company.uid, "company", "active")} type="button">Aktiv</button>
                <button className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold" onClick={() => void updateProfileStatus(company.uid, "company", "rejected")} type="button">Sperren</button>
              </div>
            </article>
          ))}
        </section>

        <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Kampagnen pruefen</h2>
          {campaigns.slice(0, 8).map((campaign) => (
            <article className="grid gap-3 rounded-lg border border-zinc-200 p-4 sm:grid-cols-[1fr_auto] sm:items-center" key={campaign.id}>
              <div>
                <p className="font-semibold">{campaign.title}</p>
                <p className="text-sm text-zinc-500">{campaign.companyName} · {campaign.status}</p>
              </div>
              <div className="flex gap-2">
                <button className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white" onClick={() => void updateCampaignStatus(campaign.id, "active")} type="button">Aktiv</button>
                <button className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold" onClick={() => void updateCampaignStatus(campaign.id, "closed")} type="button">Schliessen</button>
              </div>
            </article>
          ))}
        </section>

        <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Deals ueberwachen</h2>
          {deals.slice(0, 10).map((deal) => (
            <article className="rounded-lg border border-zinc-200 p-4" key={deal.id}>
              <p className="font-semibold">{deal.service || deal.campaignTitle || deal.id}</p>
              <p className="text-sm text-zinc-500">{deal.creatorName} · {deal.companyName} · {deal.status}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 rounded-lg border border-red-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Streitfaelle</h2>
          {deals.filter((deal) => deal.status === "dispute").map((deal) => (
            <article className="rounded-lg border border-red-200 bg-red-50 p-4" key={deal.id}>
              <p className="font-semibold">{deal.service || deal.id}</p>
              <p className="text-sm text-red-700">{deal.creatorName} · {deal.companyName}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Blacklist verwalten</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="Ziel-ID" value={blacklistForm.targetId} onChange={(event) => setBlacklistForm((current) => ({ ...current, targetId: event.target.value }))} />
            <SelectField label="Typ" value={blacklistForm.targetType} onChange={(event) => setBlacklistForm((current) => ({ ...current, targetType: event.target.value as typeof blacklistForm.targetType }))}>
              <option value="creator">Creator</option>
              <option value="company">Unternehmen</option>
              <option value="campaign">Kampagne</option>
              <option value="deal">Deal</option>
            </SelectField>
            <TextField label="Grund" value={blacklistForm.reason} onChange={(event) => setBlacklistForm((current) => ({ ...current, reason: event.target.value }))} />
          </div>
          <button className="w-fit rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white" onClick={() => void addBlacklistEntry()} type="button">Zur Blacklist hinzufuegen</button>
        </section>

        <section className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Interne Notizen</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Ziel-ID" value={noteForm.targetId} onChange={(event) => setNoteForm((current) => ({ ...current, targetId: event.target.value }))} />
            <SelectField label="Typ" value={noteForm.targetType} onChange={(event) => setNoteForm((current) => ({ ...current, targetType: event.target.value as typeof noteForm.targetType }))}>
              <option value="creator">Creator</option>
              <option value="company">Unternehmen</option>
              <option value="campaign">Kampagne</option>
              <option value="deal">Deal</option>
            </SelectField>
          </div>
          <TextAreaField label="Notiz" value={noteForm.note} onChange={(event) => setNoteForm((current) => ({ ...current, note: event.target.value }))} />
          <button className="w-fit rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white" onClick={() => void addAdminNote()} type="button">Notiz speichern</button>
        </section>
      </DashboardShell>
    </ProtectedPage>
  );
}
