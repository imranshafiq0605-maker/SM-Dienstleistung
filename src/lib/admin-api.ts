import type { NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

export async function requireAdmin(request: NextRequest) {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return { error: "Nicht angemeldet.", status: 401 as const };
  }

  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();
  const decoded = await adminAuth.verifyIdToken(token);
  const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
  const user = userDoc.data();

  if (!user || user.role !== "admin") {
    return { error: "Kein Admin-Zugriff.", status: 403 as const };
  }

  return { decoded, status: 200 as const };
}
