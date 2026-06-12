"use client";

import { auth } from "@/lib/firebase";

export async function adminUserRequest(
  uid: string,
  options: Omit<RequestInit, "headers"> & { headers?: HeadersInit } = {},
) {
  const token = await auth.currentUser?.getIdToken();

  if (!token) {
    throw new Error("Du bist nicht als Admin angemeldet.");
  }

  const response = await fetch(`/api/admin/users/${uid}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Admin-Aktion fehlgeschlagen.");
  }

  return data;
}
