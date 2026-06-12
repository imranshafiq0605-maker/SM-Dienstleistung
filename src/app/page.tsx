import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-8 sm:py-12 lg:min-h-screen lg:justify-center">
        <nav className="flex items-center justify-between">
          <Link className="text-xl font-semibold" href="/">
            CreatorFlow
          </Link>
          <div className="flex items-center gap-3">
            <Link className="text-sm font-medium text-zinc-600" href="/login">
              Login
            </Link>
            <Link
              className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
              href="/register/company"
            >
              Unternehmen
            </Link>
          </div>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Creator Kooperationen als Marktplatz
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">
              Creator und Unternehmen finden schneller passende Kooperationen.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
              CreatorFlow verbindet Registrierung, Rollen, Freigabe und
              Dashboards in einem sauberen MVP. Creator werden erst sichtbar,
              wenn ein Admin sie freigibt. Unternehmen koennen erst handeln,
              wenn ihr Status aktiv ist.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="rounded-full bg-zinc-950 px-5 py-3 text-center text-sm font-semibold text-white"
                href="/register/creator"
              >
                Creator kostenlos registrieren
              </Link>
              <Link
                className="rounded-full border border-zinc-300 px-5 py-3 text-center text-sm font-semibold text-zinc-900"
                href="/register/company"
              >
                Unternehmen registrieren
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            {[
              "Firebase Auth Account erstellen",
              "User-Dokument mit Rolle und Status speichern",
              "Creator- und Unternehmensprofile in Firestore",
              "Admin-Freigabe fuer pending Nutzer",
            ].map((item) => (
              <div
                className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
                key={item}
              >
                <p className="font-medium">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
