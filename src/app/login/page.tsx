"use client";

import { signInWithEmailAndPassword } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { TextField } from "@/components/ui/form-field";
import { auth } from "@/lib/firebase";
import { getAppUser } from "@/lib/firebase-client";
import { dashboardPathForRole } from "@/lib/routes";

export default function LoginPage() {
  const router = useRouter();
  const { appUser, loading, refreshUser, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && appUser && appUser.role !== "admin") {
      router.replace(dashboardPathForRole(appUser.role));
    }
  }, [appUser, loading, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const credentials = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getAppUser(credentials.user.uid);

      if (!userDoc) {
        await signOut();
        setError("Zu diesem Login wurde kein Nutzerprofil gefunden.");
        return;
      }

      if (userDoc.role === "admin") {
        await signOut();
        setError("Admin-Konten melden sich ueber den separaten Admin Login an.");
        return;
      }

      await refreshUser();
      router.replace(dashboardPathForRole(userDoc.role));
    } catch {
      setError("Login fehlgeschlagen. Bitte pruefe deine Daten.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="premium-shell flex min-h-screen items-center justify-center px-4 py-12 text-zinc-950 sm:px-6">
      <form
        className="premium-panel grid w-full max-w-md gap-5 rounded-lg p-6 sm:p-8"
        onSubmit={handleSubmit}
      >
        <div>
          <Link className="inline-flex items-center gap-3" href="/">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-zinc-950 text-sm font-bold text-white">
              CF
            </span>
            <span className="font-semibold">CreatorFlow</span>
          </Link>
          <h1 className="mt-7 text-3xl font-semibold tracking-tight">
            Willkommen zurueck
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Dieser Login ist fuer Creator und Unternehmen. Admins nutzen den
            separaten Admin-Zugang.
          </p>
        </div>

        <TextField
          label="E-Mail"
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
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Melde an..." : "Als Creator oder Unternehmen einloggen"}
        </button>

        <div className="grid gap-2 rounded-lg border border-zinc-200 bg-white/70 p-3 text-sm font-medium text-zinc-600 sm:grid-cols-2">
          <Link href="/register/creator">Creator registrieren</Link>
          <Link href="/register/company">Unternehmen registrieren</Link>
        </div>
      </form>
    </main>
  );
}
