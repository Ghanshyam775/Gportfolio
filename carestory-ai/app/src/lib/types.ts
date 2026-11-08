export type Role = "coordinator" | "manager" | "group_admin";

export type Channel = "internal" | "website" | "social" | "paid_ads";
export type ConsentGivenBy = "resident" | "lpa" | "best_interests";

export interface Consent {
  channel: Channel;
  granted: boolean;
}

export interface Resident {
  id: string;
  name: string;
  room?: string;
  consents: Consent[];
  givenBy: ConsentGivenBy;
  recordedAt: string; // ISO
  expiresAt?: string; // ISO
  withdrawnAt?: string;
  notes?: string;
}

export type EventType =
  | "halloween"
  | "christmas"
  | "birthday"
  | "garden"
  | "remembrance"
  | "pet_therapy"
  | "music"
  | "baking"
  | "outing"
  | "intergenerational"
  | "other";

export interface BlurBox {
  x: number; // 0..1
  y: number;
  w: number;
  h: number;
}

export type DignityFlag =
  | "distress"
  | "undress"
  | "personal_care"
  | "medical"
  | "private_room"
  | "documents";

export interface MediaAsset {
  id: string;
  kind: "image" | "video";
  name: string;
  width: number;
  height: number;
  duration?: number; // seconds (video)
  brightness: number; // 0..1
  residentIds: string[];
  unknownPeople: boolean;
  blurBoxes: BlurBox[];
  flags: DignityFlag[];
  overrideReason?: string;
  starred: boolean;
}

export type ConsentDecision = "ok" | "needs_blur" | "excluded";

export interface EventBrief {
  type: EventType;
  title: string;
  date: string; // yyyy-mm-dd
  description: string;
  highlights: string[];
  visitors?: string;
}

export interface CareEvent {
  id: string;
  homeId: string;
  brief: EventBrief;
  mediaIds: string[];
  status: "planned" | "captured" | "generated";
  createdAt: string;
}

export type Format = "reel" | "carousel" | "single" | "story";
export type ReelLength = 15 | 30 | 45 | 60;
export type Style = "cinematic" | "documentary" | "upbeat" | "elegant";
export type Platform = "instagram" | "facebook" | "tiktok" | "youtube" | "linkedin" | "google";

export type Motion = "zoom_in" | "zoom_out" | "pan_left" | "pan_right" | "still";

export interface Scene {
  id: string;
  kind: "title" | "media" | "outro";
  mediaId?: string;
  duration: number; // seconds
  overlay: string;
  voiceover: string;
  motion: Motion;
  aiMotion?: boolean; // planned image-to-video upgrade when provider configured
}

export interface PlatformCopy {
  platform: Platform;
  caption: string;
  hashtags: string[];
}

export interface Storyboard {
  hook: string;
  trend: string;
  scenes: Scene[];
  copy: PlatformCopy[];
  altText: string;
  musicMood: string;
  voiceId: string;
  qa: { check: string; ok: boolean; note?: string }[];
}

export type ProjectStatus = "draft" | "pending_approval" | "approved" | "scheduled" | "published" | "removed";

export interface Project {
  id: string;
  eventId: string;
  format: Format;
  length: ReelLength;
  style: Style;
  platforms: Platform[];
  storyboard: Storyboard;
  status: ProjectStatus;
  scheduledAt?: string;
  approvedBy?: string;
  changeRequest?: string;
  consentSnapshot: { mediaId: string; residentIds: string[]; decision: ConsentDecision }[];
  createdAt: string;
  updatedAt: string;
}

export interface BrandKit {
  homeName: string;
  tagline: string;
  logoDataUrl?: string;
  primary: string;
  secondary: string;
  accent: string;
  headingFont: "serif" | "sans" | "rounded";
  tone: "warm" | "upbeat" | "elegant";
  voiceId: string;
  musicMood: string;
  cta: string;
  phone: string;
  bookingUrl: string;
  hashtags: string[];
  cqcRating?: "Outstanding" | "Good" | "Requires improvement" | "";
  watermark: boolean;
}

export interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail?: string;
}

/** Messages streamed from the agent pipeline (NDJSON). */
export type AgentMessage =
  | { type: "step"; agent: AgentName; status: "running" | "done"; note: string }
  | { type: "log"; agent: AgentName; note: string }
  | { type: "result"; storyboard: Storyboard }
  | { type: "error"; message: string };

export type AgentName = "ingest" | "consent" | "research" | "story" | "director" | "production" | "qa";

export interface PipelineInput {
  brief: EventBrief;
  format: Format;
  length: ReelLength;
  style: Style;
  platforms: Platform[];
  brand: BrandKit;
  media: (Pick<MediaAsset, "id" | "kind" | "duration" | "brightness" | "starred" | "residentIds"> & {
    decision: ConsentDecision;
    residentNames: string[];
  })[];
}
