"use client";

import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  AdminSection,
  AdminStatCard,
  AdminTable,
  EmptyState,
  StatusBadge,
} from "@/components/admin/admin-ui";
import { db } from "@/lib/firebase";
import type {
  AppUser,
  Campaign,
  CompanyProfile,
  CreatorProfile,
  Deal,
  Dispute,
} from "@/types/creatorflow";

const adminAreas = [
  {
    countKey: "pendingUsers",
    description: "Creator freigeben, sperren und Profile kontrollieren.",
    href: "/admin/creators",
    label: "Creator Management",
    metric: "Pending Creator prüfen",
  },
  {
    countKey: "pendingUsers",
    description: "Unternehmen verifizieren, sperren und Daten prüfen.",
    href: "/admin/companies",
    label: "Unternehmen Management",
    metric: "Company Zugriffe steuern",
  },
  {
    countKey: "activeCampaigns",
    description: "Kampagnen ansehen, freigeben oder schliessen.",
    href: "/admin/campaigns",
    label: "Kampagnen Prüfung",
    metric: "Aktive Kampagnen",
  },
  {
    countKey: "openDeals",
    description: "Deals, Angebote, Zahlstatus und Content-Workflow überwachen.",
    href: "/admin/deals",
    label: "Deals & Angebote",
    metric: "Offene Deals",
  },
  {
    countKey: "openDisputes",
    description: "Streitfälle und eskalierte Kooperationen ansehen.",
    href: "/admin/disputes",
    label: "Streitfall Center",
    metric: "Offene Faelle",
  },
  {
    countKey: "settings",
    description: "Blacklist, Kategorien und interne Notizen verwalten.",
    href: "/admin/settings",
    label: "Admin Einstellungen",
    metric: "Plattform Regeln",
  },
] as const;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", {
    currency: "EUR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "creatorProfiles")),
      getDocs(collection(db, "companyProfiles")),
      getDocs(collection(db, "campaigns")),
      getDocs(collection(db, "deals")),
      getDocs(collection(db, "disputes")),
    ]).then(
      ([
        usersSnapshot,
        creatorsSnapshot,
        companiesSnapshot,
        campaignsSnapshot,
        dealsSnapshot,
        disputesSnapshot,
      ]) => {
        if (!mounted) return;

        setUsers(
          usersSnapshot.docs.map((item) => ({
            ...(item.data() as AppUser),
            uid: item.id,
          })),
        );
        setCreators(
          creatorsSnapshot.docs.map((item) => ({
            ...(item.data() as CreatorProfile),
            uid: item.id,
          })),
        );
        setCompanies(
          companiesSnapshot.docs.map((item) => ({
            ...(item.data() as CompanyProfile),
            uid: item.id,
          })),
        );
        setCampaigns(
          campaignsSnapshot.docs.map((item) => ({
            ...(item.data() as Campaign),
            id: item.id,
          })),
        );
        setDeals(
          dealsSnapshot.docs.map((item) => ({
            ...(item.data() as Deal),
            id: item.id,
          })),
        );
        setDisputes(
          disputesSnapshot.docs.map((item) => ({
            ...(item.data() as Dispute),
            id: item.id,
          })),
        );
        setLoading(false);
      },
    );

    return () => {
      mounted = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const pendingUsers = users.filter((user) => user.status === "pending").length;
    const activeCampaigns = campaigns.filter(
      (campaign) => campaign.status === "active",
    ).length;
    const openDeals = deals.filter(
      (deal) => !["completed", "paid_out"].includes(deal.status),
    ).length;
    const openDisputes =
      disputes.filter((dispute) => dispute.status !== "resolved").length +
      deals.filter((deal) => deal.status === "dispute").length;
    const estimatedRevenue = deals.reduce(
      (sum, deal) => sum + Number(deal.price || 0) * 0.15,
      0,
    );

    return {
      activeCampaigns,
      estimatedRevenue,
      openDeals,
      openDisputes,
      pendingUsers,
      settings: "Setup",
    };
  }, [campaigns, deals, disputes, users]);

  const pendingProfiles = [
    ...creators
      .filter((creator) => creator.status === "pending")
      .map((creator) => ({
        id: creator.uid,
        label: creator.artistName || `${creator.firstName} ${creator.lastName}`,
        meta: creator.email,
        role: "Creator",
        href: "/admin/creators",
      })),
    ...companies
      .filter((company) => company.status === "pending")
      .map((company) => ({
        id: company.uid,
        label: company.companyName,
        meta: company.email,
        role: "Unternehmen",
        href: "/admin/companies",
      })),
  ];

  return (
    <AdminShell
      subtitle="Kontrolliere Freigaben, Kampagnen, Deals, Streitfälle und Plattformgesundheit an einem Ort."
      title="Admin Dashboard"
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          detail={loading ? "Wird geladen" : `${creators.length} Creatorprofile`}
          label="Gesamtanzahl Nutzer"
          value={users.length}
        />
        <AdminStatCard
          detail={`${creators.filter((creator) => creator.status === "active").length} aktiv freigegeben`}
          label="Creator"
          value={creators.length}
        />
        <AdminStatCard
          detail={`${companies.filter((company) => company.status === "active").length} aktiv freigegeben`}
          label="Unternehmen"
          value={companies.length}
        />
        <AdminStatCard
          detail="Bei 15% Plattformfee geschätzt"
          label="Plattformumsatz"
          value={formatCurrency(metrics.estimatedRevenue)}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          detail="Nutzer mit Status pending"
          label="Pending Nutzer"
          value={metrics.pendingUsers}
        />
        <AdminStatCard
          detail="Kampagnen mit Status active"
          label="Aktive Kampagnen"
          value={metrics.activeCampaigns}
        />
        <AdminStatCard
          detail="Noch nicht abgeschlossen"
          label="Offene Deals"
          value={metrics.openDeals}
        />
        <AdminStatCard
          detail="Disputes und Deal-Flags"
          label="Offene Streitfälle"
          value={metrics.openDisputes}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {adminAreas.map((area) => (
          <Link
            className="group premium-panel rounded-lg p-5 hover:border-zinc-300 hover:bg-white"
            href={area.href}
            key={area.href}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-zinc-500">{area.metric}</p>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-zinc-950">
                  {area.label}
                </h2>
              </div>
              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm font-bold text-zinc-700 shadow-sm">
                {metrics[area.countKey]}
              </span>
            </div>
            <p className="mt-4 min-h-12 text-sm leading-6 text-zinc-500">
              {area.description}
            </p>
            <div className="mt-5 inline-flex rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white shadow-sm group-hover:bg-zinc-800">
              Bereich öffnen
            </div>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminSection
          action={
            <Link
              className="premium-button-secondary rounded-lg px-4 py-2 text-sm font-semibold"
              href="/admin/creators"
            >
              Alle prüfen
            </Link>
          }
          eyebrow="Freigaben"
          title="Pending Nutzer"
        >
          {pendingProfiles.length === 0 ? (
            <EmptyState
              text="Sobald sich neue Creator oder Unternehmen registrieren, erscheinen sie hier zur Freigabe."
              title="Keine offenen Freigaben"
            />
          ) : (
            <AdminTable columns={["Name", "Rolle", "Status", "Aktion"]}>
              {pendingProfiles.slice(0, 6).map((profile) => (
                <div
                  className="grid gap-3 px-4 py-4 md:grid-cols-4 md:items-center"
                  key={profile.id}
                >
                  <div>
                    <p className="font-semibold text-zinc-950">{profile.label}</p>
                    <p className="mt-1 text-sm text-zinc-500">{profile.meta}</p>
                  </div>
                  <p className="text-sm font-medium text-zinc-600">{profile.role}</p>
                  <StatusBadge status="pending" />
                  <Link
                    className="premium-button w-fit rounded-lg px-3 py-2 text-sm font-semibold"
                    href={profile.href}
                  >
                    Öffnen
                  </Link>
                </div>
              ))}
            </AdminTable>
          )}
        </AdminSection>

        <AdminSection eyebrow="Live Operation" title="Managementbereiche">
          <div className="grid gap-3">
            {[
              ["Creator verwalten", "/admin/creators", "Freigeben, sperren, Profile prüfen"],
              ["Unternehmen verwalten", "/admin/companies", "Verifizieren, sperren, Stammdaten sehen"],
              ["Kampagnen prüfen", "/admin/campaigns", "Briefings und Kampagnenstatus kontrollieren"],
              ["Deals & Angebote", "/admin/deals", "Kooperationen, Angebote und Zahlstatus sehen"],
              ["Streitfälle", "/admin/disputes", "Konflikte und Eskalationen beobachten"],
              ["Blacklist & Kategorien", "/admin/settings", "Regeln, Notizen und Kategorien pflegen"],
            ].map(([label, href, description]) => (
              <Link
                className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white/76 px-4 py-3 text-zinc-800 hover:border-zinc-300 hover:bg-white"
                href={href}
                key={href}
              >
                <span>
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="mt-1 block text-xs font-medium text-zinc-500">
                    {description}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-zinc-950 px-3 py-1 text-xs font-bold text-white">
                  Öffnen
                </span>
              </Link>
            ))}
          </div>
        </AdminSection>
      </div>

      <AdminSection eyebrow="Ueberwachung" title="Aktuelle Deals">
        {deals.length === 0 ? (
          <EmptyState
            text="Wenn ein Angebot oder eine Bewerbung zu einem Deal wird, erscheint die Kooperation in dieser Uebersicht."
            title="Noch keine Deals vorhanden"
          />
        ) : (
          <AdminTable columns={["Deal", "Creator", "Unternehmen", "Status"]}>
            {deals.slice(0, 8).map((deal) => (
              <div
                className="grid gap-3 px-4 py-4 md:grid-cols-4 md:items-center"
                key={deal.id}
              >
                <div>
                  <p className="font-semibold text-zinc-950">
                    {deal.service || deal.campaignTitle || "Kooperation"}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {formatCurrency(Number(deal.price || 0))}
                  </p>
                </div>
                <p className="text-sm text-zinc-600">{deal.creatorName || "-"}</p>
                <p className="text-sm text-zinc-600">{deal.companyName || "-"}</p>
                <StatusBadge status={deal.status} />
              </div>
            ))}
          </AdminTable>
        )}
      </AdminSection>
    </AdminShell>
  );
}
