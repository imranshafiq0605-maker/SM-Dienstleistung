import Link from "next/link";

const workflow = [
  "Creator finden und filtern",
  "Kampagnen erstellen",
  "Bewerbungen bewerten",
  "Deals, Chat und Content freigeben",
];

const metrics = [
  ["3", "Rollen"],
  ["360°", "Workflow"],
  ["Firebase", "Realtime Basis"],
];

export default function HomePage() {
  return (
    <main className="premium-shell min-h-screen text-zinc-950">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <nav className="premium-panel flex items-center justify-between rounded-lg px-4 py-3">
          <Link className="inline-flex items-center gap-3" href="/">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-zinc-950 text-sm font-bold text-white shadow-lg shadow-zinc-950/15">
              CF
            </span>
            <span className="text-lg font-semibold">CreatorFlow</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              className="premium-button-secondary rounded-lg px-4 py-2.5 text-sm font-semibold"
              href="/login"
            >
              Login
            </Link>
            <Link
              className="premium-button rounded-lg px-4 py-2.5 text-sm font-semibold"
              href="/register/company"
            >
              Unternehmen
            </Link>
          </div>
        </nav>

        <div className="grid gap-10 lg:min-h-[72vh] lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="premium-kicker">Creator Kooperationen neu gedacht</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[1.03] text-zinc-950 sm:text-7xl">
              Der Marktplatz fuer professionelle Creator-Deals.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-zinc-600 sm:text-xl">
              CreatorFlow verbindet Unternehmen und Creator in einem
              hochwertigen Workflow: Matching, Kampagnen, Bewerbungen,
              Angebote, Chat, Content-Freigaben, Bewertungen und Deals an einem
              Ort.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                className="premium-button rounded-lg px-5 py-3 text-center text-sm font-semibold"
                href="/register/creator"
              >
                Creator kostenlos registrieren
              </Link>
              <Link
                className="premium-button-secondary rounded-lg px-5 py-3 text-center text-sm font-semibold"
                href="/register/company"
              >
                Unternehmen registrieren
              </Link>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {metrics.map(([value, label]) => (
                <div className="premium-card rounded-lg p-4" key={label}>
                  <p className="text-2xl font-semibold">{value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="premium-panel rounded-lg p-4 sm:p-5">
            <div className="rounded-lg border border-zinc-200 bg-zinc-950 p-4 text-white shadow-2xl shadow-zinc-950/20">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                    Live Workspace
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">
                    Kampagne: Spring Launch
                  </h2>
                </div>
                <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                  Active
                </span>
              </div>
              <div className="mt-5 grid gap-3">
                {workflow.map((item, index) => (
                  <div
                    className="rounded-lg border border-white/10 bg-white/[0.06] p-4"
                    key={item}
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-sm font-bold text-zinc-950">
                        {index + 1}
                      </span>
                      <p className="font-medium">{item}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-white p-4 text-zinc-950">
                  <p className="text-sm font-semibold text-zinc-500">
                    Bewerbungen
                  </p>
                  <p className="mt-1 text-3xl font-semibold">24</p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-4 text-emerald-950">
                  <p className="text-sm font-semibold text-emerald-700">
                    Content Freigaben
                  </p>
                  <p className="mt-1 text-3xl font-semibold">8</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-3">
          {[
            [
              "Fuer Unternehmen",
              "Creator suchen, Kampagnen erstellen, Bewerbungen pruefen und Content freigeben.",
            ],
            [
              "Fuer Creator",
              "Unternehmen finden, Angebote erhalten, Deals verwalten und Content hochladen.",
            ],
            [
              "Fuer Admins",
              "Nutzer freigeben, Kampagnen pruefen, Streitfaelle sehen und Plattformqualitaet sichern.",
            ],
          ].map(([title, copy]) => (
            <article className="premium-card rounded-lg p-6" key={title}>
              <p className="premium-kicker">{title}</p>
              <p className="mt-4 text-lg leading-8 text-zinc-600">{copy}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
