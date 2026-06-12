import type { ReactNode } from "react";

const statusStyles: Record<string, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
  draft: "border-zinc-200 bg-zinc-50 text-zinc-600",
  closed: "border-zinc-200 bg-zinc-100 text-zinc-700",
  dispute: "border-rose-200 bg-rose-50 text-rose-700",
  open: "border-amber-200 bg-amber-50 text-amber-700",
  in_review: "border-sky-200 bg-sky-50 text-sky-700",
  resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function AdminStatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <article className="premium-card rounded-lg p-5">
      <p className="text-sm font-semibold text-zinc-500">{label}</p>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">
        {value}
      </p>
      <p className="mt-2 text-sm text-zinc-500">{detail}</p>
    </article>
  );
}

export function AdminSection({
  title,
  eyebrow,
  action,
  children,
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="premium-panel rounded-lg p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {eyebrow ? <p className="premium-kicker">{eyebrow}</p> : null}
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">
            {title}
          </h2>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function EmptyState({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white/60 px-6 py-10 text-center">
      <p className="text-base font-semibold text-zinc-950">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
        {text}
      </p>
    </div>
  );
}

export function StatusBadge({ status }: { status?: string }) {
  const normalized = status || "unknown";
  const className =
    statusStyles[normalized] || "border-zinc-200 bg-zinc-50 text-zinc-600";

  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {normalized.replaceAll("_", " ")}
    </span>
  );
}

export function AdminTable({
  columns,
  children,
}: {
  columns: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white/86">
      <div
        className="hidden border-b border-zinc-200 bg-zinc-50/80 px-4 py-3 text-xs font-bold uppercase tracking-wide text-zinc-500 md:grid"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
      >
        {columns.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>
      <div className="divide-y divide-zinc-100">{children}</div>
    </div>
  );
}
