import type { EventType, Style } from "../types";

/** Care-sector content knowledge used by the Research & Story agents (and as LLM context later). */

export const EVENT_TEMPLATES: Record<EventType, { label: string; emoji: string; hashtags: string[]; mood: string; prompts: string[] }> = {
  halloween: { label: "Halloween", emoji: "🎃", hashtags: ["Halloween", "SpookySeason", "PumpkinCarving"], mood: "Playful spooky", prompts: ["Best costume?", "Pumpkin carving", "Visitors?"] },
  christmas: { label: "Christmas", emoji: "🎄", hashtags: ["Christmas", "Festive", "ChristmasCarols"], mood: "Festive bells", prompts: ["Carols?", "Santa visit?", "Christmas dinner"] },
  birthday: { label: "Birthday", emoji: "🎂", hashtags: ["HappyBirthday", "Celebration"], mood: "Joyful", prompts: ["Whose birthday & age?", "Cake", "Family visit?"] },
  garden: { label: "Garden party", emoji: "🌷", hashtags: ["GardenParty", "Gardening", "Outdoors"], mood: "Sunny acoustic", prompts: ["What was planted?", "Tea & cake", "Weather"] },
  remembrance: { label: "Remembrance", emoji: "🌺", hashtags: ["LestWeForget", "RemembranceDay", "PoppyAppeal"], mood: "Gentle reflective", prompts: ["Veterans present?", "Poppy crafts", "Two-minute silence"] },
  pet_therapy: { label: "Pet therapy", emoji: "🐶", hashtags: ["PetTherapy", "TherapyDogs", "Wellbeing"], mood: "Light and happy", prompts: ["Animal's name?", "Favourite moment"] },
  music: { label: "Music & dance", emoji: "🎶", hashtags: ["MusicTherapy", "Singalong", "Dementia"], mood: "Nostalgic swing", prompts: ["Which songs?", "Performer?"] },
  baking: { label: "Baking", emoji: "🧁", hashtags: ["Baking", "BakeOff", "Teatime"], mood: "Cosy", prompts: ["What was baked?", "Family recipe?"] },
  outing: { label: "Day out", emoji: "🚌", hashtags: ["DayOut", "Seaside", "Community"], mood: "Adventurous", prompts: ["Where to?", "Highlight"] },
  intergenerational: { label: "School visit", emoji: "🧒", hashtags: ["Intergenerational", "Community", "Generations"], mood: "Heartwarming", prompts: ["Which school?", "Activity together"] },
  other: { label: "Other activity", emoji: "✨", hashtags: ["ActivitiesForSeniors", "Wellbeing"], mood: "Warm", prompts: ["What happened?", "Highlight"] },
};

export const STYLE_PRESETS: Record<Style, { label: string; desc: string; pace: number; motions: ("zoom_in" | "zoom_out" | "pan_left" | "pan_right")[] }> = {
  cinematic: { label: "Cinematic", desc: "Slow push-ins, film grade, emotional score", pace: 1.15, motions: ["zoom_in", "pan_right", "zoom_out", "pan_left"] },
  documentary: { label: "Warm documentary", desc: "Natural, honest, gentle narration", pace: 1, motions: ["zoom_in", "zoom_out"] },
  upbeat: { label: "Upbeat & trendy", desc: "Fast cuts on the beat, bold captions", pace: 0.7, motions: ["zoom_in", "pan_left", "pan_right"] },
  elegant: { label: "Elegant", desc: "Refined serif titles, calm pacing", pace: 1.3, motions: ["zoom_out", "pan_right"] },
};

/** Reel formats that perform well in 2026 (curated; the Research Agent refreshes via trend APIs when configured). */
export const TREND_FORMATS = [
  { id: "pov", name: "POV hook", hook: (t: string) => `POV: you're a resident at our ${t} 🥹` },
  { id: "reveal", name: "Reveal", hook: (t: string) => `Wait for the ${t} reveal…` },
  { id: "dayin", name: "Day in the life", hook: (t: string, secs = 30) => `A day at our ${t}, in ${secs} seconds` },
  { id: "notacare", name: "Expectation vs reality", hook: () => `Think care homes are quiet? Watch this.` },
  { id: "age", name: "Age is just a number", hook: () => `Who says fun has an age limit?` },
  { id: "rate", name: "Rate this", hook: (t: string) => `Rate our ${t} out of 10 👇` },
];

/** UK awareness days relevant to care homes (month 1-12, day). Dates for movable events are approximate — confirm yearly. */
export const AWARENESS_DAYS: { m: number; d: number; name: string; tip: string }[] = [
  { m: 1, d: 24, name: "Global Belly Laugh Day", tip: "Share a funny moment" },
  { m: 2, d: 14, name: "Valentine's Day", tip: "Love stories of residents' marriages" },
  { m: 3, d: 1, name: "St David's Day", tip: "Welsh cakes baking" },
  { m: 3, d: 17, name: "St Patrick's Day", tip: "Irish music afternoon" },
  { m: 4, d: 23, name: "St George's Day", tip: "Afternoon tea & bunting" },
  { m: 5, d: 15, name: "Dementia Action Week (approx.)", tip: "Myth-busting reel" },
  { m: 6, d: 9, name: "Carers Week (approx.)", tip: "Staff spotlight" },
  { m: 6, d: 20, name: "Care Home Open Day (approx.)", tip: "Invite the community" },
  { m: 7, d: 1, name: "Summer fete season", tip: "Garden party recap" },
  { m: 9, d: 21, name: "World Alzheimer's Day", tip: "Memory-café moments" },
  { m: 10, d: 1, name: "International Day of Older Persons", tip: "Resident wisdom quotes" },
  { m: 10, d: 31, name: "Halloween", tip: "Costume reveal reel" },
  { m: 11, d: 5, name: "Bonfire Night", tip: "Sparklers & hot chocolate" },
  { m: 11, d: 11, name: "Armistice Day", tip: "Veterans' stories (with consent)" },
  { m: 12, d: 25, name: "Christmas Day", tip: "Festive countdown series" },
];

export function upcomingAwarenessDays(from = new Date(), count = 4) {
  const out: { date: Date; name: string; tip: string }[] = [];
  for (let y = from.getFullYear(); y <= from.getFullYear() + 1; y++)
    for (const a of AWARENESS_DAYS) {
      const date = new Date(y, a.m - 1, a.d);
      if (date >= new Date(from.getFullYear(), from.getMonth(), from.getDate())) out.push({ date, name: a.name, tip: a.tip });
    }
  return out.sort((a, b) => +a.date - +b.date).slice(0, count);
}

export const VOICES = [
  { id: "en-GB-warm-female", label: "Eleanor — warm, British (F)" },
  { id: "en-GB-warm-male", label: "Oliver — friendly, British (M)" },
  { id: "en-GB-bright-female", label: "Poppy — upbeat, British (F)" },
  { id: "en-GB-calm-male", label: "Henry — calm narrator (M)" },
];

export const MUSIC_MOODS = ["Warm acoustic", "Cinematic strings", "Upbeat pop", "Nostalgic swing", "Gentle piano", "Festive bells", "Playful spooky"];
