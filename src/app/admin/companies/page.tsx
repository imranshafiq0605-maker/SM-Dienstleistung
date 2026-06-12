"use client";

import { collection, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
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
import type { CompanyProfile, UserStatus } from "@/types/creatorflow";

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getDocs(collection(db, "companyProfiles")).then((snapshot) => {
      if (!mounted) return;

      setCompanies(
        snapshot.docs.map((item) => ({
          ...(item.data() as CompanyProfile),
          uid: item.id,
        })),
      );
    });

    return () => {
      mounted = false;
    };
  }, []);

  async function updateCompanyStatus(uid: string, status: UserStatus) {
    setUpdatingUid(uid);
    await updateDoc(doc(db, "users", uid), {
      status,
      updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "companyProfiles", uid), {
      status,
      updatedAt: serverTimestamp(),
    });
    setCompanies((current) =>
      current.map((company) =>
        company.uid === uid ? { ...company, status } : company,
      ),
    );
    setUpdatingUid(null);
  }

  return (
    <AdminShell
      subtitle="Verifiziere Unternehmen, kontrolliere Brancheninformationen und schalte Marktplatzzugang frei."
      title="Unternehmen verwalten"
    >
      <section className="grid gap-4 md:grid-cols-4">
        <AdminStatCard
          detail="Alle Firmenprofile"
          label="Gesamt"
          value={companies.length}
        />
        <AdminStatCard
          detail="Warten auf Pruefung"
          label="Pending"
          value={companies.filter((company) => company.status === "pending").length}
        />
        <AdminStatCard
          detail="Duerfen Creator kontaktieren"
          label="Aktiv"
          value={companies.filter((company) => company.status === "active").length}
        />
        <AdminStatCard
          detail="Gesperrt oder abgelehnt"
          label="Gesperrt"
          value={companies.filter((company) => company.status === "rejected").length}
        />
      </section>

      <AdminSection eyebrow="Companies" title="Alle Unternehmensprofile">
        {companies.length === 0 ? (
          <EmptyState
            text="Registrierte Unternehmen erscheinen hier zur Pruefung und Verwaltung."
            title="Noch keine Unternehmen vorhanden"
          />
        ) : (
          <AdminTable columns={["Unternehmen", "Branche", "Ort", "Status", "Aktionen"]}>
            {companies.map((company) => (
              <div
                className="grid gap-3 px-4 py-4 md:grid-cols-5 md:items-center"
                key={company.uid}
              >
                <div>
                  <p className="font-semibold text-zinc-950">{company.companyName}</p>
                  <p className="mt-1 text-sm text-zinc-500">{company.email}</p>
                </div>
                <p className="text-sm text-zinc-600">{company.industry || "-"}</p>
                <p className="text-sm text-zinc-600">
                  {[company.city, company.country].filter(Boolean).join(", ") || "-"}
                </p>
                <StatusBadge status={company.status} />
                <div className="flex flex-wrap gap-2">
                  <button
                    className="premium-button rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50"
                    disabled={updatingUid === company.uid}
                    onClick={() => void updateCompanyStatus(company.uid, "active")}
                    type="button"
                  >
                    Freigeben
                  </button>
                  <button
                    className="premium-button-secondary rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50"
                    disabled={updatingUid === company.uid}
                    onClick={() => void updateCompanyStatus(company.uid, "rejected")}
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
