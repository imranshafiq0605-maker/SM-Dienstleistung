import type { Timestamp } from "firebase/firestore";

export type UserRole = "admin" | "creator" | "company";
export type UserStatus = "pending" | "active" | "rejected";
export type FirestoreDate = Timestamp | Date | null;
export type Gender = "male" | "female" | "diverse" | "not_specified";
export type SocialPlatform =
  | "TikTok"
  | "Instagram"
  | "YouTube"
  | "Twitch"
  | "Snapchat"
  | "LinkedIn";
export type CampaignStatus = "draft" | "active" | "closed";
export type CompensationType = "fixed" | "negotiable";
export type ApplicationStatus =
  | "applied"
  | "seen"
  | "in_review"
  | "accepted"
  | "rejected"
  | "counter_offer"
  | "deal_created";
export type OfferStatus =
  | "sent"
  | "seen"
  | "accepted"
  | "rejected"
  | "counter_offer"
  | "deal_created";
export type OfferDirection = "company_to_creator" | "creator_to_company";
export type DealStatus =
  | "contract_open"
  | "payment_open"
  | "payment_received"
  | "shipping_open"
  | "product_shipped"
  | "product_arrived"
  | "content_in_progress"
  | "content_uploaded"
  | "feedback_open"
  | "revision"
  | "approved"
  | "published"
  | "completed"
  | "payout_open"
  | "paid_out"
  | "dispute";

export interface UploadedAsset {
  name: string;
  url: string;
  path: string;
  uploadedAt: FirestoreDate;
}

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  username: string;
  profileUrl: string;
  followers: number;
  averageViews: number;
  engagementRate: number;
  audienceAge: string;
  audienceCountry: string;
}

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
  address: string;
  birthDate: string;
  gender: Gender;
  city: string;
  country: string;
  language: string;
  bio: string;
  shortBio?: string;
  categories: string[];
  audience: string;
  availability: string;
  minimumPrice: number;
  priceStory: number;
  priceReel: number;
  priceTikTok: number;
  priceYouTubeShort: number;
  priceYouTubeVideo: number;
  priceUgcVideo: number;
  rating?: number;
  verified?: boolean;
  ugcAvailable?: boolean;
  profileImageUrl: string | null;
  mediaKit: UploadedAsset[];
  screenshots: UploadedAsset[];
  portfolio: UploadedAsset[];
  socialAccounts: SocialAccount[];
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
  address: string;
  billingAddress: string;
  vatId: string;
  city: string;
  country: string;
  description: string;
  logoUrl: string | null;
  socialLinks: string[];
  activeCampaigns?: number;
  budgetMin?: number;
  budgetMax?: number;
  verified?: boolean;
  status: UserStatus;
  createdAt: FirestoreDate;
}

export interface PendingUser extends AppUser {
  profileLabel: string;
}

export interface Campaign {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  productName: string;
  productDescription: string;
  productImages: UploadedAsset[];
  productValue: number;
  feeMin: number;
  feeMax: number;
  compensationType: CompensationType;
  includesProductPackage: boolean;
  platforms: SocialPlatform[];
  format: string;
  goal: string;
  targetAudience: string;
  category: string;
  creatorCount: number;
  applicationDeadline: string;
  contentDeadline: string;
  publishDate: string;
  hashtags: string[];
  links: string[];
  discountCode: string;
  dos: string;
  donts: string;
  briefing: string;
  files: UploadedAsset[];
  usageRights: string;
  adUsage: boolean;
  whitelisting: boolean;
  exclusivity: boolean;
  productShipping: boolean;
  shippingInfo: string;
  status: CampaignStatus;
  matchFollowerMin: number;
  matchFollowerMax: number;
  matchCountry: string;
  matchLanguage: string;
  matchEngagementMin: number;
  matchGender: Gender | "";
  createdAt: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface CampaignApplication {
  id: string;
  campaignId: string;
  campaignTitle: string;
  companyId: string;
  companyName: string;
  creatorId: string;
  creatorName: string;
  desiredFee: number;
  message: string;
  fitReason: string;
  videoIdea: string;
  publishDate: string;
  files: UploadedAsset[];
  status: ApplicationStatus;
  companyMessage?: string;
  counterOfferPrice?: number;
  counterOfferMessage?: string;
  createdAt: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface Offer {
  id: string;
  direction: OfferDirection;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  creatorId: string;
  companyId: string;
  campaignId?: string;
  campaignTitle?: string;
  price: number;
  service: string;
  platform: SocialPlatform | "";
  format: string;
  deadline: string;
  usageRights: string;
  whitelisting: boolean;
  revisions: number;
  productShipping: boolean;
  briefing: string;
  files: UploadedAsset[];
  paymentTerms: string;
  cancellationRules: string;
  status: OfferStatus;
  message?: string;
  createdAt: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface Deal {
  id: string;
  sourceType: "application" | "offer";
  sourceId: string;
  campaignId?: string;
  campaignTitle?: string;
  creatorId: string;
  creatorName: string;
  companyId: string;
  companyName: string;
  price: number;
  service: string;
  platform: SocialPlatform | "";
  format: string;
  deadline: string;
  status: DealStatus;
  createdAt: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sourceType: "deal" | "offer";
  sourceId: string;
  senderId: string;
  senderName: string;
  body: string;
  attachments: UploadedAsset[];
  readBy: string[];
  createdAt: FirestoreDate;
}

export interface ContentSubmission {
  id: string;
  dealId: string;
  creatorId: string;
  companyId: string;
  caption: string;
  postLink: string;
  files: UploadedAsset[];
  status: "uploaded" | "approved" | "revision_requested";
  feedback?: string;
  createdAt: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface CreatorReview {
  id: string;
  dealId: string;
  creatorId: string;
  companyId: string;
  quality: number;
  communication: number;
  punctuality: number;
  briefingFollowed: number;
  note: string;
  createdAt: FirestoreDate;
}

export interface CompanyReview {
  id: string;
  dealId: string;
  creatorId: string;
  companyId: string;
  communication: number;
  paymentProcess: number;
  briefingClarity: number;
  fairness: number;
  note: string;
  createdAt: FirestoreDate;
}

export interface BlacklistEntry {
  id: string;
  targetId: string;
  targetType: UserRole | "campaign" | "deal";
  reason: string;
  createdAt: FirestoreDate;
}

export interface AdminNote {
  id: string;
  targetId: string;
  targetType: UserRole | "campaign" | "deal";
  note: string;
  createdAt: FirestoreDate;
}

export interface Dispute {
  id: string;
  dealId: string;
  title: string;
  reason: string;
  status: "open" | "in_review" | "resolved" | "rejected";
  creatorId?: string;
  creatorName?: string;
  companyId?: string;
  companyName?: string;
  createdAt: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export interface PlatformCategory {
  id: string;
  name: string;
  active: boolean;
  createdAt: FirestoreDate;
}
