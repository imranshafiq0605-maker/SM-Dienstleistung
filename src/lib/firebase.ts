<<<<<<< HEAD
import { getApps, initializeApp } from "firebase/app";
=======
import { initializeApp, getApps } from "firebase/app";
>>>>>>> f19fbb24007937f9ee47185f268473795d462b63
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
<<<<<<< HEAD
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
=======
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
>>>>>>> f19fbb24007937f9ee47185f268473795d462b63
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
<<<<<<< HEAD
export const storage = getStorage(app);
=======
export const storage = getStorage(app);
>>>>>>> f19fbb24007937f9ee47185f268473795d462b63
