"use client";

import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
  doc,
} from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { TextField } from "@/components/ui/form-field";
import { auth, db } from "@/lib/firebase";

export default function AdminSetupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [adminExists, setAdminExists] = useState(false);
  const [displayName, setDisplayName] = useState("Admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    getDocs(query(collection(db, "users"), where("role", "==", "admin"), limit(1)))
      .then((snapshot) => {
        if (!mounted) return;
        setAdminExists(!snapshot.empty);
        setChecking(false);
      })
      .catch(() => {
        if (!mounted) return;
        setError("Admin-Pruefung fehlgeschlagen. Pruefe deine Firestore Rules.");
        setChecking(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const existingAdmins = await getDocs(
        query(collection(db, "users"), where("role", "==", "admin"), limit(1)),
      );

      if (!existingAdmins.empty) {
        setAdminExists(true);
        setSubmitting(false);
        return;
      }

      const credentials = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      await setDoc(doc(db, "users", credentials.user.uid), {
        createdAt: serverTimestamp(),
        displayName,
        email,
        role: "admin",
        status: "active",
        uid: credentials.user.uid,
      });

      router.replace("/admin/dashboard");
    } catch {
      setError(
        "Admin konnte nicht erstellt werden. Pruefe E-Mail, Passwort und Firebase Rules.",
      );
      setSubmitting(false);
    }
  }

  return (
    <main className="premium-shell flex min-h-screen items-center justify-center px-4 py-12">
      <section className="premium-panel w-full max-w-xl rounded-lg p-6 sm:p-8">
        <p className="premium-kicker">CreatorFlow</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
          First Admin Setup
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-500">
          Diese Seite erstellt den ersten Admin-Account nur, solange noch kein
          Admin in der Firestore Collection users existiert.
        </p>

        {checking ? (
          <div className="mt-6 rounded-lg border border-zinc-200 bg-white/70 p-4 text-sm font-medium text-zinc-500">
            Pruefe Admin-Status...
          </div>
        ) : null}

        {!checking && adminExists ? (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="font-semibold text-emerald-900">
              Es existiert bereits ein Admin.
            </p>
            <p className="mt-2 text-sm leading-6 text-emerald-800">
              Logge dich mit diesem Admin-Account ein. Falls dein aktueller User
              Admin sein soll, setze in Firestore users/deineUid role auf admin.
            </p>
            <Link
              className="premium-button mt-4 inline-flex rounded-lg px-4 py-3 text-sm font-semibold"
              href="/admin/login"
            >
              Zum Admin Login
            </Link>
          </div>
        ) : null}

        {!checking && !adminExists ? (
          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <TextField
              label="Admin Name"
              onChange={(event) => setDisplayName(event.target.value)}
              required
              value={displayName}
            />
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

            {error ? (
              <p className="text-sm font-semibold text-red-600">{error}</p>
            ) : null}

            <button
              className="premium-button rounded-lg px-5 py-3 text-sm font-semibold disabled:opacity-50"
              disabled={submitting}
              type="submit"
            >
              {submitting ? "Admin wird erstellt..." : "Admin erstellen"}
            </button>
          </form>
        ) : null}
      </section>
    </main>
  );
}
