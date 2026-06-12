"use client";

import { collection, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  AdminSection,
  AdminStatCard,
  AdminTable,
  EmptyState,
  StatusBadge,
} from "@/components/admin/admin-ui";
import { db } from "@/lib/firebase";
import type { CreatorProfile, UserStatus } from "@/types/creatorflow";

export default function AdminCreatorsPage() {
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getDocs(collection(db, "creatorProfiles")).then((snapshot) => {
      if (!mounted) return;

      setCreators(
        snapshot.docs.map((item) => ({
          ...(item.data() as CreatorProfile),
          uid: item.id,
        })),
      );
    });

    return () => {
      mounted = false;
    };
  }, []);

  async function updateCreatorStatus(uid: string, status: UserStatus) {
    setUpdatingUid(uid);
    await updateDoc(doc(db, "users", uid), {
      status,
      updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "creatorProfiles", uid), {
      status,
      updatedAt: serverTimestamp(),
    });
    setCreators((current) =>
      current.map((creator) =>
        creator.uid === uid ? { ...creator, status } : creator,
      ),
    );
    setUpdatingUid(null);
  }

  return (
    <AdminShell
      subtitle="Prüfe Creatorprofile, schalte passende Profile frei und sperre auffällige Accounts."
      title="Creator verwalten"
    >
      <section className="grid gap-4 md:grid-cols-4">
        <AdminStatCard
          detail="Alle Creatorprofile"
          label="Gesamt"
          value={creators.length}
        />
        <AdminStatCard
          detail="Warten auf Admin-Freigabe"
          label="Pending"
          value={creators.filter((creator) => creator.status === "pending").length}
        />
        <AdminStatCard
          detail="Sichtbar im Marktplatz"
          label="Aktiv"
          value={creators.filter((creator) => creator.status === "active").length}
        />
        <AdminStatCard
          detail="Gesperrt oder abgelehnt"
          label="Gesperrt"
          value={creators.filter((creator) => creator.status === "rejected").length}
        />
      </section>

      <AdminSection eyebrow="Creator" title="Alle Creatorprofile">
        {creators.length === 0 ? (
          <EmptyState
            text="Neue Creatorprofile erscheinen hier, sobald sich Creator registrieren."
            title="Noch keine Creator vorhanden"
          />
        ) : (
          <AdminTable
            columns={["Creator", "Kategorie", "Profil", "Status", "Aktionen"]}
          >
            {creators.map((creator) => (
              <div
                className="grid gap-3 px-4 py-4 md:grid-cols-5 md:items-center"
                key={creator.uid}
              >
                <div>
                  <p className="font-semibold text-zinc-950">
                    {creator.artistName || `${creator.firstName} ${creator.lastName}`}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">{creator.email}</p>
                </div>
                <p className="text-sm text-zinc-600">
                  {creator.categories?.slice(0, 2).join(", ") || "-"}
                </p>
                <div className="text-sm text-zinc-600">
                  <p>
                    {[creator.city, creator.country].filter(Boolean).join(", ") || "-"}
                  </p>
                  <p className="mt-1 font-medium text-zinc-800">
                    ab {Number(creator.minimumPrice || 0).toLocaleString("de-DE")} EUR
                  </p>
                </div>
                <StatusBadge status={creator.status} />
                <div className="flex flex-wrap gap-2">
                  <Link
                    className="premium-button-secondary rounded-lg px-3 py-2 text-sm font-semibold"
                    href={`/admin/creators/${creator.uid}`}
                  >
                    Öffnen
                  </Link>
                  <button
                    className="premium-button rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50"
                    disabled={updatingUid === creator.uid}
                    onClick={() => void updateCreatorStatus(creator.uid, "active")}
                    type="button"
                  >
                    Freigeben
                  </button>
                  <button
                    className="premium-button-secondary rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50"
                    disabled={updatingUid === creator.uid}
                    onClick={() => void updateCreatorStatus(creator.uid, "rejected")}
                    type="button"
                  >
                    Sperren
                  </button>
                </div>
              </div>
            ))}
          </AdminTable>
        )}
      </AdminSection>
    </AdminShell>
  );
}
