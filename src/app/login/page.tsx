"use client";

import { signInWithEmailAndPassword } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { TextField } from "@/components/ui/form-field";
import { auth } from "@/lib/firebase";
import { dashboardPathForRole } from "@/lib/routes";

export default function LoginPage() {
  const router = useRouter();
  const { appUser, loading, refreshUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && appUser) {
      router.replace(dashboardPathForRole(appUser.role));
    }
  }, [appUser, loading, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      await refreshUser();
    } catch {
      setError("Login fehlgeschlagen. Bitte pruefe deine Daten.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12 text-zinc-950">
      <form
        className="grid w-full max-w-md gap-5 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
        onSubmit={handleSubmit}
      >
        <div>
          <Link className="text-sm font-semibold text-zinc-500" href="/">
            CreatorFlow
          </Link>
          <h1 className="mt-3 text-3xl font-semibold">Login</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Melde dich mit deinem Firebase Auth Account an.
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
          className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Melde an..." : "Einloggen"}
        </button>

        <div className="grid gap-2 text-sm text-zinc-600 sm:grid-cols-2">
          <Link href="/register/creator">Creator registrieren</Link>
          <Link href="/register/company">Unternehmen registrieren</Link>
        </div>
      </form>
    </main>
  );
}
