import type { PipelineInput, Platform, PlatformCopy } from "../types";
import { EVENT_TEMPLATES, TREND_FORMATS } from "./knowledge";
import { hash, pick } from "../utils";

/**
 * Provider abstraction (PRD §9). Every generative capability sits behind an interface so
 * models can be swapped without touching agents. Only mock implementations exist today;
 * real adapters are added in `registry()` when API keys are configured.
 *
 * Planned adapters:
 *  - StoryWriter  → Anthropic Claude (ANTHROPIC_API_KEY)
 *  - Vision       → Google Gemini (GOOGLE_API_KEY) for scene detection / best-moment scoring
 *  - Voice        → ElevenLabs (ELEVENLABS_API_KEY)
 *  - ImageToVideo → Veo 3.1 via Vertex AI / Kling 3.0 via fal.ai (FAL_KEY)
 *  - Image        → GPT Image 2 (OPENAI_API_KEY) / FLUX.2 via fal.ai
 *  - Music        → licensed library API
 */

export interface ResearchResult {
  trendId: string;
  trendName: string;
  hook: string;
  angle: string;
  hashtags: string[];
}

export interface StoryDraft {
  hook: string;
  beats: string[]; // one VO line per media beat
  overlays: string[]; // on-screen text per beat
  outro: string;
  copy: PlatformCopy[];
  altText: string;
}

export interface Researcher {
  name: string;
  research(input: PipelineInput): Promise<ResearchResult>;
}
export interface StoryWriter {
  name: string;
  write(input: PipelineInput, research: ResearchResult, beatCount: number): Promise<StoryDraft>;
}
export interface VoiceProvider {
  name: string;
  /** Returns an audio URL; mock returns null and the client previews with browser speech. */
  synthesize(text: string, voiceId: string): Promise<string | null>;
}
export interface ImageToVideoProvider {
  name: string;
  available: boolean;
}

// ---------------- Mock implementations ----------------

const firstName = (n: string) => n.split(" ")[0];

const mockResearcher: Researcher = {
  name: "Built-in trend library (mock)",
  async research(input) {
    const tpl = EVENT_TEMPLATES[input.brief.type];
    const seed = hash(input.brief.title + input.style);
    const trend = input.style === "upbeat" ? pick(TREND_FORMATS.slice(0, 2), seed) : pick(TREND_FORMATS, seed);
    const label = input.brief.title.trim() || `${tpl.label} celebration`;
    return {
      trendId: trend.id,
      trendName: trend.name,
      hook: trend.hook(label, input.format === "story" ? 15 : input.length),
      angle: input.brief.visitors ? "community & generations coming together" : "joy, belonging and personality",
      hashtags: Array.from(new Set([...tpl.hashtags, ...input.brand.hashtags])).slice(0, 8),
    };
  },
};

const mockWriter: StoryWriter = {
  name: "Template story writer (mock)",
  async write(input, research, beatCount) {
    const { brief, brand } = input;
    const names = Array.from(new Set(input.media.flatMap((m) => m.residentNames))).map(firstName);
    const hl = brief.highlights.filter(Boolean);
    const desc = brief.description.trim().replace(/\.$/, "");
    const warm = brand.tone === "elegant" ? "" : brand.tone === "upbeat" ? " 🎉" : " 💛";

    const pool = [
      desc ? `${desc}.` : `Today at ${brand.homeName} was something special.`,
      ...hl.map((h) => `${h.replace(/\.$/, "")}.`),
      names[0] ? `${names[0]} had everyone smiling.` : "Smiles all round.",
      brief.visitors ? `A huge thank you to ${brief.visitors} for joining us.` : "Every moment, shared together.",
      names[1] ? `And ${names[1]} showed us how it's done.` : "Laughter really is the best medicine.",
      "This is what home feels like.",
      "Memories made, one moment at a time.",
    ];
    const beats = Array.from({ length: beatCount }, (_, i) => pool[i % pool.length]);
    const overlays = beats.map((b, i) =>
      i === 0 ? brief.title : b.length > 38 ? b.split(/[,.!]/)[0].slice(0, 38) : b.replace(/\.$/, ""),
    );
    const tags = research.hashtags.map((h) => `#${h}`);
    const lead = hl[0] ? hl[0].replace(/\.$/, "") : desc || brief.title;
    const copyFor = (p: Platform): PlatformCopy => {
      const base = `${brief.title}${warm}\n\n${lead}.${brief.visitors ? ` Thank you, ${brief.visitors}!` : ""}`;
      const map: Record<Platform, string> = {
        instagram: `${research.hook}\n\n${base}\n\n${brand.cta} — link in bio.`,
        tiktok: `${research.hook} ${warm.trim()}`,
        facebook: `${base}\n\nFamilies — we love sharing these moments with you. ${brand.cta}: ${brand.bookingUrl} or call ${brand.phone}.`,
        youtube: `${brief.title} | ${brand.homeName}`,
        linkedin: `At ${brand.homeName}, meaningful activities are at the heart of person-centred care. ${base.replace(warm, "")}\n\nInterested in joining our team or visiting? ${brand.bookingUrl}`,
        google: `${brief.title} at ${brand.homeName}. ${lead}. ${brand.cta}: ${brand.phone}.`,
      };
      const n = p === "tiktok" ? 5 : p === "linkedin" ? 3 : p === "google" ? 0 : 8;
      return { platform: p, caption: map[p], hashtags: tags.slice(0, n) };
    };
    return {
      hook: research.hook,
      beats,
      overlays,
      outro: brand.cta,
      copy: input.platforms.map(copyFor),
      altText: `Photos and video from ${brief.title} at ${brand.homeName}${hl[0] ? `, including ${hl[0].toLowerCase()}` : ""}.`,
    };
  },
};

const mockVoice: VoiceProvider = { name: "Browser speech preview (mock)", synthesize: async () => null };
const mockI2V: ImageToVideoProvider = { name: "Ken Burns motion (no AI video provider)", available: false };

export function registry() {
  // TODO(integration): return real adapters when env keys exist, e.g.
  // const writer = process.env.ANTHROPIC_API_KEY ? claudeWriter : mockWriter;
  return { researcher: mockResearcher, writer: mockWriter, voice: mockVoice, imageToVideo: mockI2V };
}

export function providerStatus() {
  const k = (name: string) => Boolean(process.env[name]);
  return [
    { capability: "Story & research (Claude)", env: "ANTHROPIC_API_KEY", configured: k("ANTHROPIC_API_KEY"), active: registry().writer.name },
    { capability: "Video understanding (Gemini)", env: "GOOGLE_API_KEY", configured: k("GOOGLE_API_KEY"), active: "Client-side brightness scoring" },
    { capability: "Voiceover (ElevenLabs)", env: "ELEVENLABS_API_KEY", configured: k("ELEVENLABS_API_KEY"), active: registry().voice.name },
    { capability: "Image-to-video (Veo / Kling)", env: "FAL_KEY / GOOGLE_VERTEX_PROJECT", configured: k("FAL_KEY"), active: registry().imageToVideo.name },
    { capability: "Image generation (GPT Image 2 / FLUX.2)", env: "OPENAI_API_KEY", configured: k("OPENAI_API_KEY"), active: "Canvas title cards" },
    { capability: "Social publishing (Ayrshare / direct)", env: "AYRSHARE_API_KEY", configured: k("AYRSHARE_API_KEY"), active: "Download & manual post" },
  ];
}
