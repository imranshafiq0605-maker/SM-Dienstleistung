import type { Timestamp } from "firebase/firestore";

export type UserRole = "admin" | "creator" | "company";
export type UserStatus = "pending" | "active" | "rejected";
export type FirestoreDate = Timestamp | Date | null;

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  displayName: string;
  createdAt: FirestoreDate;
}

export interface CreatorProfile {
  uid: string;
  firstName: string;
  lastName: string;
  artistName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  shortBio: string;
  categories: string[];
  profileImageUrl: string | null;
  status: UserStatus;
  createdAt: FirestoreDate;
}

export interface CompanyProfile {
  uid: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  city: string;
  country: string;
  description: string;
  logoUrl: string | null;
  status: UserStatus;
  createdAt: FirestoreDate;
}

export interface PendingUser extends AppUser {
  profileLabel: string;
}
