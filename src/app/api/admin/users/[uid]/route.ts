import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { FieldValue, getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

type RouteContext = {
  params: Promise<{ uid: string }>;
};

type AdminUserPayload = {
  auth?: {
    disabled?: boolean;
    displayName?: string;
    email?: string;
    emailVerified?: boolean;
    password?: string;
  };
  companyProfile?: Record<string, unknown>;
  creatorProfile?: Record<string, unknown>;
  customClaims?: Record<string, unknown>;
  user?: Record<string, unknown>;
};

function cleanObject<T extends Record<string, unknown>>(value?: T) {
  if (!value) return undefined;

  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  );
}

export async function GET(request: NextRequest, context: RouteContext) {
  const admin = await requireAdmin(request);
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { uid } = await context.params;
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();
  const [authUser, userDoc, creatorDoc, companyDoc] = await Promise.all([
    adminAuth.getUser(uid),
    adminDb.collection("users").doc(uid).get(),
    adminDb.collection("creatorProfiles").doc(uid).get(),
    adminDb.collection("companyProfiles").doc(uid).get(),
  ]);

  return NextResponse.json({
    auth: {
      disabled: authUser.disabled,
      displayName: authUser.displayName || "",
      email: authUser.email || "",
      emailVerified: authUser.emailVerified,
      uid: authUser.uid,
    },
    companyProfile: companyDoc.exists ? companyDoc.data() : null,
    creatorProfile: creatorDoc.exists ? creatorDoc.data() : null,
    user: userDoc.exists ? userDoc.data() : null,
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const admin = await requireAdmin(request);
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { uid } = await context.params;
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();
  const body = (await request.json()) as AdminUserPayload;
  const authUpdate = cleanObject(body.auth);

  if (authUpdate?.password === "") {
    delete authUpdate.password;
  }

  if (authUpdate && Object.keys(authUpdate).length > 0) {
    await adminAuth.updateUser(uid, authUpdate);
  }

  if (body.customClaims) {
    await adminAuth.setCustomUserClaims(uid, body.customClaims);
  }

  const batch = adminDb.batch();
  const updatedAt = FieldValue.serverTimestamp();

  if (body.user) {
    batch.set(
      adminDb.collection("users").doc(uid),
      { ...body.user, uid, updatedAt },
      { merge: true },
    );
  }

  if (body.creatorProfile) {
    batch.set(
      adminDb.collection("creatorProfiles").doc(uid),
      { ...body.creatorProfile, uid, updatedAt },
      { merge: true },
    );
  }

  if (body.companyProfile) {
    batch.set(
      adminDb.collection("companyProfiles").doc(uid),
      { ...body.companyProfile, uid, updatedAt },
      { merge: true },
    );
  }

  await batch.commit();

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const admin = await requireAdmin(request);
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { uid } = await context.params;
  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();
  const batch = adminDb.batch();

  batch.delete(adminDb.collection("users").doc(uid));
  batch.delete(adminDb.collection("creatorProfiles").doc(uid));
  batch.delete(adminDb.collection("companyProfiles").doc(uid));

  await batch.commit();
  await adminAuth.deleteUser(uid);

  return NextResponse.json({ ok: true });
}
