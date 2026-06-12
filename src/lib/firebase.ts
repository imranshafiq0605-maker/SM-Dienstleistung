import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA9s6X8IzsNGXRe0__HzRnHl8V8IQbq1zE",
  authDomain: "sm-dienstleistung-f0873.firebaseapp.com",
  projectId: "sm-dienstleistung-f0873",
  storageBucket: "sm-dienstleistung-f0873.firebasestorage.app",
  messagingSenderId: "541172763743",
  appId: "1:541172763743:web:334ba419316ef88bed9fea",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);