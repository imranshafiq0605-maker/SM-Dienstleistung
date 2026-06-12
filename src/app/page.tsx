export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-3xl text-center">
        <h1 className="text-5xl font-bold mb-6">SM Dienstleistung</h1>
        <p className="text-xl text-gray-600 mb-8">
          Plattform für Creator, Unternehmen und Social-Media-Kampagnen.
        </p>
        <div className="flex gap-4 justify-center">
          <a href="/login" className="rounded-xl bg-black text-white px-6 py-3">
            Login
          </a>
          <a href="/register" className="rounded-xl border px-6 py-3">
            Registrieren
          </a>
        </div>
      </div>
    </main>
  );
}