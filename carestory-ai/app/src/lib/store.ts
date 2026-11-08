"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AuditEvent,
  BrandKit,
  CareEvent,
  MediaAsset,
  Project,
  Resident,
  Role,
} from "./types";
import { uid } from "./utils";

/**
 * Client-side store for the MVP prototype. Persisted to localStorage.
 * Replace with Postgres (via API routes) when the backend lands — the shape
 * mirrors the PRD data model: Home → Residents / Events / Media / Projects / Audit.
 */

export const defaultBrand: BrandKit = {
  homeName: "Oakwood Care Home",
  tagline: "Where every day feels like home",
  primary: "#2F5D50",
  secondary: "#FBF8F4",
  accent: "#E07A5F",
  headingFont: "serif",
  tone: "warm",
  voiceId: "en-GB-warm-female",
  musicMood: "Warm acoustic",
  cta: "Come and see life at Oakwood — book a visit",
  phone: "01234 567890",
  bookingUrl: "https://example.com/visit",
  hashtags: ["CareHome", "CareHomeLife", "ElderlyCare", "UKCare"],
  cqcRating: "Good",
  watermark: true,
};

const iso = (d: Date) => d.toISOString();
const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

const seedResidents: Resident[] = [
  { id: "r_joan", name: "Joan Whitaker", room: "12", givenBy: "resident", recordedAt: iso(addDays(-120)), expiresAt: iso(addDays(245)), consents: [{ channel: "internal", granted: true }, { channel: "website", granted: true }, { channel: "social", granted: true }, { channel: "paid_ads", granted: false }] },
  { id: "r_arthur", name: "Arthur Bell", room: "4", givenBy: "lpa", recordedAt: iso(addDays(-60)), expiresAt: iso(addDays(20)), consents: [{ channel: "internal", granted: true }, { channel: "website", granted: true }, { channel: "social", granted: true }, { channel: "paid_ads", granted: false }], notes: "LPA (health & welfare): daughter, Sarah Bell" },
  { id: "r_margaret", name: "Margaret Ellis", room: "7", givenBy: "resident", recordedAt: iso(addDays(-30)), consents: [{ channel: "internal", granted: true }, { channel: "website", granted: false }, { channel: "social", granted: false }, { channel: "paid_ads", granted: false }], notes: "Happy for internal newsletter only" },
  { id: "r_ken", name: "Ken Okafor", room: "15", givenBy: "best_interests", recordedAt: iso(addDays(-200)), consents: [{ channel: "internal", granted: true }, { channel: "website", granted: true }, { channel: "social", granted: true }, { channel: "paid_ads", granted: true }] },
  { id: "r_dorothy", name: "Dorothy Shah", room: "2", givenBy: "resident", recordedAt: iso(addDays(-10)), consents: [{ channel: "internal", granted: false }, { channel: "website", granted: false }, { channel: "social", granted: false }, { channel: "paid_ads", granted: false }] },
];

const seedEvents: CareEvent[] = [
  { id: "e_bonfire", homeId: "h1", status: "planned", createdAt: iso(new Date()), mediaIds: [], brief: { type: "other", title: "Bonfire Night sparkler evening", date: iso(addDays(3)).slice(0, 10), description: "Hot chocolate and sparklers in the garden", highlights: [] } },
  { id: "e_remembrance", homeId: "h1", status: "planned", createdAt: iso(new Date()), mediaIds: [], brief: { type: "remembrance", title: "Remembrance service with poppy crafts", date: iso(addDays(6)).slice(0, 10), description: "Two-minute silence and poppy wreath making", highlights: [] } },
  { id: "e_xmas", homeId: "h1", status: "planned", createdAt: iso(new Date()), mediaIds: [], brief: { type: "christmas", title: "Christmas carols with St Mary's choir", date: iso(addDays(40)).slice(0, 10), description: "Local school choir visit", highlights: [] } },
];

interface State {
  role: Role;
  userName: string;
  brand: BrandKit;
  residents: Resident[];
  events: CareEvent[];
  media: Record<string, MediaAsset>;
  projects: Project[];
  audit: AuditEvent[];
  requireApproval: boolean;

  setRole: (r: Role) => void;
  log: (action: string, detail?: string) => void;
  updateBrand: (p: Partial<BrandKit>) => void;
  upsertResident: (r: Resident) => void;
  withdrawConsent: (residentId: string) => number;
  addEvent: (e: CareEvent) => void;
  updateEvent: (id: string, p: Partial<CareEvent>) => void;
  deleteEvent: (id: string) => void;
  putMedia: (m: MediaAsset) => void;
  updateMedia: (id: string, p: Partial<MediaAsset>) => void;
  addProject: (p: Project) => void;
  updateProject: (id: string, p: Partial<Project>) => void;
  setRequireApproval: (v: boolean) => void;
  reset: () => void;
}

const initial = {
  role: "manager" as Role,
  userName: "Mark (Home Manager)",
  brand: defaultBrand,
  residents: seedResidents,
  events: seedEvents,
  media: {} as Record<string, MediaAsset>,
  projects: [] as Project[],
  audit: [] as AuditEvent[],
  requireApproval: true,
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initial,
      setRole: (role) =>
        set({
          role,
          userName:
            role === "coordinator" ? "Aisha (Activity Coordinator)" : role === "manager" ? "Mark (Home Manager)" : "Priya (Group Marketing)",
        }),
      log: (action, detail) =>
        set((s) => ({ audit: [{ id: uid("a"), at: new Date().toISOString(), actor: s.userName, action, detail }, ...s.audit].slice(0, 500) })),
      updateBrand: (p) => set((s) => ({ brand: { ...s.brand, ...p } })),
      upsertResident: (r) => {
        const exists = get().residents.some((x) => x.id === r.id);
        set((s) => ({ residents: exists ? s.residents.map((x) => (x.id === r.id ? r : x)) : [...s.residents, r] }));
        get().log(exists ? "Consent updated" : "Resident added", r.name);
      },
      withdrawConsent: (residentId) => {
        const s = get();
        const r = s.residents.find((x) => x.id === residentId);
        if (!r) return 0;
        const affected = s.projects.filter(
          (p) => p.status !== "removed" && p.consentSnapshot.some((c) => c.residentIds.includes(residentId)),
        );
        set({
          residents: s.residents.map((x) =>
            x.id === residentId ? { ...x, withdrawnAt: new Date().toISOString(), consents: x.consents.map((c) => ({ ...c, granted: false })) } : x,
          ),
          projects: s.projects.map((p) => (affected.includes(p) ? { ...p, status: "removed", updatedAt: new Date().toISOString() } : p)),
        });
        get().log("Consent withdrawn — takedown", `${r.name}: ${affected.length} item(s) removed`);
        return affected.length;
      },
      addEvent: (e) => {
        set((s) => ({ events: [e, ...s.events] }));
        get().log("Event created", e.brief.title);
      },
      updateEvent: (id, p) => set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, ...p } : e)) })),
      deleteEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
      putMedia: (m) => set((s) => ({ media: { ...s.media, [m.id]: m } })),
      updateMedia: (id, p) => set((s) => ({ media: { ...s.media, [id]: { ...s.media[id], ...p } } })),
      addProject: (p) => {
        set((s) => ({ projects: [p, ...s.projects] }));
        get().log("Content generated", `${p.format} · ${p.style}`);
      },
      updateProject: (id, p) =>
        set((s) => ({ projects: s.projects.map((x) => (x.id === id ? { ...x, ...p, updatedAt: new Date().toISOString() } : x)) })),
      setRequireApproval: (v) => {
        set({ requireApproval: v });
        get().log("Approval setting changed", v ? "Manager approval required" : "Approval optional");
      },
      reset: () => set({ ...initial }),
    }),
    { name: "carestory-v1" },
  ),
);
