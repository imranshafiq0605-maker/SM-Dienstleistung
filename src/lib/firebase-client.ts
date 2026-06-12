import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AppUser } from "@/types/creatorflow";

export async function getAppUser(uid: string) {
  const snapshot = await getDoc(doc(db, "users", uid));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as AppUser;
}
