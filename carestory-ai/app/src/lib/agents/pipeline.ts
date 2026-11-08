import type { AgentMessage, PipelineInput, Scene, Storyboard } from "../types";
import { STYLE_PRESETS } from "../ai/knowledge";
import { registry } from "../ai/providers";
import { uid } from "../utils";

/**
 * Multi-agent pipeline (PRD §5). Runs server-side; emits progress messages so the
 * UI can show agents working. Each agent is a pure step over typed data so it can be
 * moved into a durable workflow engine (Inngest/Temporal) without rewrites.
 */

type Emit = (m: AgentMessage) => void;
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

const TITLE_SECS = 2.5;
const OUTRO_SECS = 3;

export async function runPipeline(input: PipelineInput, emit: Emit, opts: { delayMs?: number } = {}): Promise<Storyboard> {
  const d = opts.delayMs ?? 600;
  const { researcher, writer, imageToVideo } = registry();
  const preset = STYLE_PRESETS[input.style];

  // ① Ingest — rank usable media
  emit({ type: "step", agent: "ingest", status: "running", note: `Reviewing ${input.media.length} photos & clips` });
  await pause(d);
  const usable = input.media
    .filter((m) => m.decision === "ok")
    .map((m) => ({
      ...m,
      score: (m.starred ? 2 : 0) + (1 - Math.abs(0.55 - m.brightness) * 2) + (m.residentIds.length > 0 ? 0.5 : 0) + (m.kind === "video" ? 0.3 : 0),
    }))
    .sort((a, b) => b.score - a.score);
  const dark = input.media.filter((m) => m.brightness < 0.18).length;
  if (dark) emit({ type: "log", agent: "ingest", note: `${dark} item(s) are very dark — will brighten or skip` });
  emit({ type: "step", agent: "ingest", status: "done", note: `${usable.length} usable moments found` });

  // ② Consent Guard — final enforcement (UI already confirmed)
  emit({ type: "step", agent: "consent", status: "running", note: "Checking every person against the consent register" });
  await pause(d);
  const excluded = input.media.length - usable.length;
  if (usable.length === 0) {
    emit({ type: "error", message: "No media is cleared for social use. Tag residents, draw blur boxes, or add more photos." });
    throw new Error("no usable media");
  }
  emit({ type: "step", agent: "consent", status: "done", note: excluded ? `${excluded} item(s) held back to protect residents` : "Everyone featured has valid social consent" });

  // ③ Research
  emit({ type: "step", agent: "research", status: "running", note: "Looking at seasonal hooks & reel formats that work now" });
  await pause(d);
  const research = await researcher.research(input);
  emit({ type: "step", agent: "research", status: "done", note: `Using the “${research.trendName}” format` });

  // ⑤ Director (beat count) is decided before writing so script length matches the cut
  const isReel = input.format === "reel" || input.format === "story";
  const total = input.format === "story" ? 15 : input.length;
  const perBeat = Math.max(1.6, 2.6 * preset.pace);
  const bodySecs = isReel ? total - TITLE_SECS - OUTRO_SECS : 0;
  const beatCount = isReel
    ? Math.max(1, Math.min(usable.length * (input.length >= 45 ? 3 : 2), Math.floor(bodySecs / perBeat)))
    : Math.min(usable.length, input.format === "carousel" ? 10 : 1);

  // ④ Story
  emit({ type: "step", agent: "story", status: "running", note: "Writing the hook, script and captions" });
  await pause(d);
  const draft = await writer.write(input, research, beatCount);
  emit({ type: "log", agent: "story", note: `Hook: “${draft.hook}”` });
  emit({ type: "step", agent: "story", status: "done", note: `${draft.beats.length}-beat script in ${input.brand.tone} British English` });

  // ⑤ Director — shot list
  emit({ type: "step", agent: "director", status: "running", note: "Choosing shots, pacing and camera moves" });
  await pause(d);
  const beatSecs = isReel ? +(bodySecs / beatCount).toFixed(2) : 0;
  const scenes: Scene[] = [];
  if (isReel) scenes.push({ id: uid("s"), kind: "title", duration: TITLE_SECS, overlay: draft.hook, voiceover: draft.hook, motion: "still" });
  for (let i = 0; i < beatCount; i++) {
    const m = usable[i % usable.length];
    scenes.push({
      id: uid("s"),
      kind: "media",
      mediaId: m.id,
      duration: beatSecs,
      overlay: draft.overlays[i],
      voiceover: draft.beats[i],
      motion: m.kind === "video" ? "still" : preset.motions[i % preset.motions.length],
      aiMotion: m.kind === "image" && input.style === "cinematic" && i < 3,
    });
  }
  if (isReel) scenes.push({ id: uid("s"), kind: "outro", duration: OUTRO_SECS, overlay: draft.outro, voiceover: draft.outro, motion: "still" });
  emit({ type: "step", agent: "director", status: "done", note: isReel ? `${scenes.length} scenes · ${total}s · ${input.brand.musicMood}` : `${scenes.length} slide(s) selected` });

  // ⑥ Production plan
  emit({ type: "step", agent: "production", status: "running", note: "Preparing voiceover, music and motion" });
  await pause(d);
  emit({ type: "log", agent: "production", note: imageToVideo.available ? "AI motion will be applied to hero stills" : "AI video provider not connected — using cinematic Ken Burns motion" });
  emit({ type: "step", agent: "production", status: "done", note: "Ready to render in your browser" });

  // ⑦ QA
  emit({ type: "step", agent: "qa", status: "running", note: "Checking brand, captions and consent once more" });
  await pause(d);
  const qa: Storyboard["qa"] = [
    { check: "Only consent-cleared media used", ok: scenes.every((s) => !s.mediaId || usable.some((u) => u.id === s.mediaId)) },
    { check: "Hook within first 2.5 seconds", ok: !isReel || scenes[0]?.kind === "title" },
    { check: "Call to action included", ok: Boolean(input.brand.cta) },
    { check: "No medical or outcome claims", ok: !/cure|treat|guarantee/i.test(draft.beats.join(" ")) },
    { check: "Captions fit platform limits", ok: draft.copy.every((c) => c.caption.length <= (c.platform === "tiktok" ? 2200 : 2000)) },
    { check: "Duration matches selection", ok: !isReel || Math.abs(scenes.reduce((a, s) => a + s.duration, 0) - total) < 0.5, note: isReel ? `${total}s` : undefined },
  ];
  emit({ type: "step", agent: "qa", status: "done", note: `${qa.filter((q) => q.ok).length}/${qa.length} checks passed` });

  const storyboard: Storyboard = {
    hook: draft.hook,
    trend: research.trendName,
    scenes,
    copy: draft.copy,
    altText: draft.altText,
    musicMood: input.brand.musicMood,
    voiceId: input.brand.voiceId,
    qa,
  };
  emit({ type: "result", storyboard });
  return storyboard;
}
