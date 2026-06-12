import Link from "next/link";

const stats = [
  ["360°", "Kooperationsworkflow"],
  ["3", "Rollen mit klaren Rechten"],
  ["Live", "Deals, Chat und Freigaben"],
];

const flow = [
  "Matching",
  "Kampagne",
  "Angebot",
  "Deal",
  "Content",
  "Freigabe",
  "Bewertung",
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f7f3] text-zinc-950">
      <section className="hero-media relative min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.45),transparent_32%),linear-gradient(120deg,rgba(5,150,105,0.28),rgba(15,23,42,0.2),rgba(244,114,182,0.18))] animated-gradient" />

        <nav className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link className="liquid-glass rounded-lg px-4 py-3" href="/">
            <span className="text-sm font-black tracking-tight">CreatorFlow</span>
          </Link>
          <div className="hidden items-center gap-2 md:flex">
            <Link className="liquid-glass rounded-lg px-4 py-3 text-sm font-semibold" href="/login">
              Einloggen
            </Link>
            <Link className="rounded-lg bg-zinc-950 px-4 py-3 text-sm font-semibold text-white shadow-2xl shadow-zinc-950/20" href="/register/company">
              Unternehmen starten
            </Link>
          </div>
          <Link className="liquid-glass rounded-lg px-4 py-3 text-sm font-semibold md:hidden" href="/login">
            Menü
          </Link>
        </nav>

        <div className="relative z-10 mx-auto grid min-h-[calc(100vh-92px)] w-full max-w-7xl items-center gap-10 px-4 pb-24 pt-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="slide-in-left">
            <p className="inline-flex rounded-full border border-white/50 bg-white/60 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-900 backdrop-blur">
              Creator-Marktplatz aus Deutschland
            </p>
            <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.96] tracking-tight text-white drop-shadow-2xl sm:text-7xl lg:text-8xl">
              Kooperationen, die sich wie Zukunft anfühlen.
            </h1>
            <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-white/86 sm:text-xl">
              CreatorFlow verbindet Creator und Unternehmen in einem hochwertigen
              Workflow für Suche, Kampagnen, Angebote, Deals, Content-Freigaben
              und Bewertungen.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link className="rounded-lg bg-white px-6 py-4 text-center text-sm font-black text-zinc-950 shadow-2xl shadow-black/20" href="/register/creator">
                Creator kostenlos registrieren
              </Link>
              <Link className="liquid-glass rounded-lg px-6 py-4 text-center text-sm font-black text-zinc-950" href="/register/company">
                Unternehmen registrieren
              </Link>
            </div>
          </div>

          <div className="slide-in-right">
            <div className="liquid-glass float-soft rounded-lg p-4">
              <div className="rounded-lg bg-zinc-950/92 p-5 text-white shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
                      Live Deal Room
                    </p>
                    <h2 className="mt-2 text-2xl font-black">Summer Launch</h2>
                  </div>
                  <span className="bounce-soft rounded-full bg-emerald-400 px-3 py-1.5 text-xs font-black text-emerald-950">
                    Aktiv
                  </span>
                </div>
                <div className="mt-6 grid gap-3">
                  {flow.map((item, index) => (
                    <div
                      className="rounded-lg border border-white/10 bg-white/[0.08] p-4"
                      key={item}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{item}</span>
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-sm font-black text-zinc-950">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {stats.map(([value, label]) => (
                    <div className="rounded-lg bg-white p-4 text-zinc-950" key={label}>
                      <p className="text-2xl font-black">{value}</p>
                      <p className="mt-1 text-xs font-semibold text-zinc-500">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
        <article className="creator-media slide-in-left min-h-[560px] rounded-lg p-6 text-white shadow-2xl shadow-zinc-950/15 lg:p-8">
          <div className="flex h-full flex-col justify-end">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
              Für Creator
            </p>
            <h2 className="mt-3 max-w-xl text-4xl font-black tracking-tight sm:text-6xl">
              Marken finden, Deals verhandeln, Content liefern.
            </h2>
            <p className="mt-5 max-w-xl text-base font-medium leading-8 text-white/82">
              Baue dein Profil auf, verwalte Socials und Media Kit, bewirb dich
              auf Kampagnen und behalte jeden Deal im Blick.
            </p>
            <Link className="mt-7 w-fit rounded-lg bg-white px-5 py-3 text-sm font-black text-zinc-950" href="/register/creator">
              Creator werden
            </Link>
          </div>
        </article>

        <article className="company-media slide-in-right min-h-[560px] rounded-lg p-6 text-white shadow-2xl shadow-zinc-950/15 lg:p-8">
          <div className="flex h-full flex-col justify-end">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
              Für Unternehmen
            </p>
            <h2 className="mt-3 max-w-xl text-4xl font-black tracking-tight sm:text-6xl">
              Creator suchen, Kampagnen starten, Ergebnisse steuern.
            </h2>
            <p className="mt-5 max-w-xl text-base font-medium leading-8 text-white/82">
              Filtere Creator, sende Angebote, prüfe Bewerbungen und organisiere
              Feedback, Briefing und Freigabe an einem Ort.
            </p>
            <Link className="mt-7 w-fit rounded-lg bg-white px-5 py-3 text-sm font-black text-zinc-950" href="/register/company">
              Unternehmen starten
            </Link>
          </div>
        </article>
      </section>

      <nav className="liquid-glass fixed inset-x-3 bottom-3 z-30 grid grid-cols-3 rounded-lg p-2 md:hidden">
        <Link className="rounded-lg px-3 py-3 text-center text-xs font-black" href="/register/creator">
          Creator
        </Link>
        <Link className="rounded-lg bg-zinc-950 px-3 py-3 text-center text-xs font-black text-white" href="/login">
          Login
        </Link>
        <Link className="rounded-lg px-3 py-3 text-center text-xs font-black" href="/register/company">
          Firma
        </Link>
      </nav>
    </main>
  );
}
