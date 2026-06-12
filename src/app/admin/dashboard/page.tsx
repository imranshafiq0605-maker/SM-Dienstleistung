"use client";

import {
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
import { db } from "@/lib/firebase";
import type { AppUser, PendingUser, UserStatus } from "@/types/creatorflow";

export default function AdminDashboardPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

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

  return (
    <ProtectedPage role="admin">
      <DashboardShell title="Admin Dashboard">
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
      </DashboardShell>
    </ProtectedPage>
  );
}
