export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-16 text-zinc-950">
      <section className="w-full max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          SM Dienstleistung
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
          Bereit fur Vercel.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
          Die Next.js-App liegt jetzt direkt im Repository-Root und kann ohne
          verschachtelte Projektstruktur gebaut werden.
        </p>
      </section>
    </main>
  );
}
