"use client";

import { signInWithEmailAndPassword } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { TextField } from "@/components/ui/form-field";
import { auth } from "@/lib/firebase";
import { getAppUser } from "@/lib/firebase-client";

export default function AdminLoginPage() {
  const router = useRouter();
  const { appUser, loading, refreshUser, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && appUser?.role === "admin") {
      router.replace("/admin/dashboard");
    }
  }, [appUser, loading, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const credentials = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getAppUser(credentials.user.uid);

      if (!userDoc || userDoc.role !== "admin") {
        await signOut();
        setError("Dieser Account ist kein Admin-Account.");
        return;
      }

      await refreshUser();
      router.replace("/admin/dashboard");
    } catch {
      setError("Admin Login fehlgeschlagen. Bitte pruefe deine Daten.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="premium-shell flex min-h-screen items-center justify-center px-4 py-12 text-zinc-950 sm:px-6">
      <section className="grid w-full max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="premium-panel rounded-lg p-6 sm:p-8">
          <p className="premium-kicker">CreatorFlow Admin</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950">
            Separater Admin Zugang
          </h1>
          <p className="mt-4 text-sm leading-6 text-zinc-500">
            Dieser Bereich ist nicht im normalen Website-Login sichtbar und ist
            nur fuer Plattform-Administratoren gedacht.
          </p>
          <div className="mt-8 grid gap-3">
            {["Nutzer freigeben", "Kampagnen pruefen", "Deals ueberwachen"].map(
              (item) => (
                <div
                  className="rounded-lg border border-zinc-200 bg-white/70 px-4 py-3 text-sm font-semibold text-zinc-700"
                  key={item}
                >
                  {item}
                </div>
              ),
            )}
          </div>
        </div>

        <form
          className="premium-panel grid gap-5 rounded-lg p-6 sm:p-8"
          onSubmit={handleSubmit}
        >
          <div>
            <Link className="inline-flex items-center gap-3" href="/">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-zinc-950 text-sm font-bold text-white">
                CF
              </span>
              <span className="font-semibold">CreatorFlow</span>
            </Link>
            <h2 className="mt-7 text-3xl font-semibold tracking-tight">
              Admin einloggen
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Melde dich hier nur mit einem Account an, dessen Rolle in
              Firestore auf admin gesetzt ist.
            </p>
          </div>

          {appUser && appUser.role !== "admin" ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">
                Du bist aktuell als {appUser.role} eingeloggt.
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-800">
                Melde diesen Account ab, um dich separat als Admin anzumelden.
              </p>
              <button
                className="mt-3 rounded-lg bg-amber-950 px-4 py-2 text-sm font-semibold text-white"
                onClick={() => void signOut()}
                type="button"
              >
                Abmelden und Admin Login nutzen
              </button>
            </div>
          ) : null}

          <TextField
            label="Admin E-Mail"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
          <TextField
            label="Passwort"
            minLength={6}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />

          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

          <button
            className="premium-button rounded-lg px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:bg-zinc-400"
            disabled={submitting || Boolean(appUser && appUser.role !== "admin")}
            type="submit"
          >
            {submitting ? "Admin wird angemeldet..." : "Admin Login"}
          </button>

          <div className="flex flex-wrap gap-3 text-sm font-medium text-zinc-600">
            <Link href="/login">Normaler Login</Link>
            <Link href="/admin/setup">First Admin Setup</Link>
          </div>
        </form>
      </section>
    </main>
  );
}
