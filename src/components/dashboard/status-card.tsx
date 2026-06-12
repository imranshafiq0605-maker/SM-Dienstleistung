import type { UserStatus } from "@/types/creatorflow";

export function StatusCard({
  status,
  activeText,
}: {
  status: UserStatus;
  activeText: string;
}) {
  const copy = {
    pending:
      "Dein Account wartet auf Admin-Freigabe. Bis dahin sind Funktionen eingeschraenkt.",
    active: activeText,
    rejected:
      "Dein Account wurde abgelehnt. Bitte kontaktiere den Plattform-Support.",
  };

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
        Account Status
      </p>
      <h2 className="mt-2 text-2xl font-semibold capitalize">{status}</h2>
      <p className="mt-3 max-w-2xl text-zinc-600">{copy[status]}</p>
    </section>
  );
}
