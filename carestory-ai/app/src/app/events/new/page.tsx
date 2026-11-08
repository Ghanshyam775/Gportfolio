"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ImagePlus, Loader2, Mic, Plus, ShieldCheck, Star, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { EVENT_TEMPLATES, STYLE_PRESETS } from "@/lib/ai/knowledge";
import { decide } from "@/lib/consent";
import { createDemoAsset, ingestFile } from "@/lib/media";
import type { EventBrief, EventType, Format, MediaAsset, PipelineInput, Platform, ReelLength, Storyboard, Style } from "@/lib/types";
import { cn, uid } from "@/lib/utils";
import { DecisionBadge, MediaThumb } from "@/components/ui";
import { ConsentEditor } from "@/components/ConsentEditor";
import { AgentRun } from "@/components/AgentRun";

const STEPS = ["Event", "Media", "Consent", "Format", "Create"];
const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube Shorts" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "google", label: "Google Business" },
];

export default function NewEventPage() {
  return (
    <Suspense>
      <Wizard />
    </Suspense>
  );
}

function Wizard() {
  const router = useRouter();
  const params = useSearchParams();
  const store = useStore();
  const { residents, media, brand } = store;
  const [step, setStep] = useState(0);
  const [eventId] = useState(() => params.get("from") ?? uid("e"));
  const existing = store.events.find((e) => e.id === eventId);
  const [brief, setBrief] = useState<EventBrief>(
    existing?.brief ?? { type: "halloween", title: "", date: new Date().toISOString().slice(0, 10), description: "", highlights: [""] },
  );
  const [mediaIds, setMediaIds] = useState<string[]>(existing?.mediaIds ?? []);
  const [uploading, setUploading] = useState(0);
  const [editing, setEditing] = useState<string | null>(null);
  const [format, setFormat] = useState<Format>("reel");
  const [length, setLength] = useState<ReelLength>(30);
  const [style, setStyle] = useState<Style>("cinematic");
  const [platforms, setPlatforms] = useState<Platform[]>(["instagram", "facebook", "tiktok"]);
  const [listening, setListening] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const demoDone = useRef(false);

  // Halloween demo: prefilled brief + generated placeholder media with consent tags
  useEffect(() => {
    if (params.get("demo") !== "1" || demoDone.current) return;
    demoDone.current = true;
    setBrief({
      type: "halloween",
      title: "Halloween party in the lounge",
      date: new Date().toISOString().slice(0, 10),
      description: "Pumpkin carving, apple bobbing and a costume parade",
      highlights: ["Joan, 94, won best costume as a witch", "Arthur carved the scariest pumpkin", "Children from St Mary's School joined the parade"],
      visitors: "St Mary's School",
    });
    (async () => {
      setUploading(6);
      const specs: [string, number, Partial<MediaAsset>][] = [
        ["Costume parade", 20, { residentIds: ["r_joan", "r_ken"], starred: true }],
        ["Pumpkin carving", 30, { residentIds: ["r_arthur"] }],
        ["Witch Joan", 280, { residentIds: ["r_joan"], starred: true }],
        ["Apple bobbing", 0, { residentIds: ["r_ken", "r_margaret"] }],
        ["School visit", 200, { unknownPeople: true }],
        ["Spooky lounge", 260, {}],
      ];
      const ids: string[] = [];
      for (const [label, hue, patch] of specs) {
        const a = await createDemoAsset(label, hue);
        store.putMedia({ ...a, ...patch });
        ids.push(a.id);
        setUploading((u) => u - 1);
      }
      setMediaIds(ids);
      setStep(2);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const assets = mediaIds.map((id) => media[id]).filter(Boolean);
  const decisions = useMemo(() => Object.fromEntries(assets.map((a) => [a.id, decide(a, residents)])), [assets, residents]);
  const cleared = assets.filter((a) => decisions[a.id] === "ok").length;
  const needBlur = assets.filter((a) => decisions[a.id] === "needs_blur").length;

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"));
    setUploading((u) => u + list.length);
    for (const f of list) {
      try {
        const a = await ingestFile(f);
        store.putMedia(a);
        setMediaIds((ids) => [...ids, a.id]);
      } catch {
        alert(`Couldn't read ${f.name}. Try JPG, PNG, HEIC (converted by your phone), MP4 or MOV.`);
      } finally {
        setUploading((u) => u - 1);
      }
    }
  };

  const dictate = () => {
    const SR = (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike; SpeechRecognition?: new () => SpeechRecognitionLike })
      .SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!SR) return alert("Voice notes need Chrome or Safari. You can type instead.");
    const rec = new SR();
    rec.lang = "en-GB";
    rec.onresult = (e) => setBrief((b) => ({ ...b, description: `${b.description} ${e.results[0][0].transcript}`.trim() }));
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  };

  const saveEvent = () => {
    const ev = { id: eventId, homeId: "h1", brief, mediaIds, status: "captured" as const, createdAt: existing?.createdAt ?? new Date().toISOString() };
    if (existing) store.updateEvent(eventId, ev);
    else store.addEvent(ev);
  };

  const pipelineInput: PipelineInput = useMemo(
    () => ({
      brief: { ...brief, highlights: brief.highlights.filter(Boolean) },
      format,
      length,
      style,
      platforms,
      brand,
      media: assets.map((a) => ({
        id: a.id,
        kind: a.kind,
        duration: a.duration,
        brightness: a.brightness,
        starred: a.starred,
        residentIds: a.residentIds,
        residentNames: a.residentIds.map((id) => residents.find((r) => r.id === id)?.name ?? "").filter(Boolean),
        decision: decisions[a.id],
      })),
    }),
    // freeze input once agents start
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step === 4],
  );

  const onResult = useCallback(
    (sb: Storyboard) => {
      const now = new Date().toISOString();
      const id = uid("p");
      store.addProject({
        id,
        eventId,
        format: pipelineInput.format,
        length: pipelineInput.length,
        style: pipelineInput.style,
        platforms: pipelineInput.platforms,
        storyboard: sb,
        status: "draft",
        consentSnapshot: pipelineInput.media.map((a) => ({ mediaId: a.id, residentIds: a.residentIds, decision: a.decision })),
        createdAt: now,
        updatedAt: now,
      });
      store.updateEvent(eventId, { status: "generated" });
      router.push(`/projects/${id}`);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pipelineInput],
  );

  const canNext = [brief.title.trim().length > 2, assets.length > 0 && uploading === 0, cleared > 0, platforms.length > 0][step] ?? false;
  const next = () => {
    if (step === 1 || step === 3) saveEvent();
    setStep((s) => s + 1);
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => (step === 0 || step === 4 ? router.back() : setStep(step - 1))} className="rounded-full p-2 hover:bg-black/5" aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <ol className="flex flex-1 items-center gap-1.5 sm:gap-3">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold",
                  i < step ? "bg-brand text-white" : i === step ? "bg-accent text-white" : "bg-black/5 text-muted",
                )}
              >
                {i < step ? <Check size={14} /> : i + 1}
              </span>
              <span className={cn("hidden text-sm font-medium sm:block", i === step ? "text-ink" : "text-muted")}>{s}</span>
              {i < STEPS.length - 1 && <span className="h-px flex-1 bg-line" />}
            </li>
          ))}
        </ol>
      </div>

      {step === 0 && (
        <section className="mx-auto max-w-3xl space-y-6">
          <div>
            <h1 className="text-3xl font-semibold">Tell us what happened</h1>
            <p className="mt-1 text-muted">A few words is plenty. The storyteller does the rest.</p>
          </div>
          <div>
            <p className="label">Event type</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {(Object.keys(EVENT_TEMPLATES) as EventType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setBrief({ ...brief, type: t })}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl border p-3 text-xs font-medium transition",
                    brief.type === t ? "border-brand bg-brand-soft text-brand" : "border-line bg-white hover:bg-black/[0.02]",
                  )}
                >
                  <span className="text-2xl">{EVENT_TEMPLATES[t].emoji}</span>
                  {EVENT_TEMPLATES[t].label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <div>
              <label className="label" htmlFor="title">
                Title
              </label>
              <input id="title" className="input" placeholder="e.g. Halloween party in the lounge" value={brief.title} onChange={(e) => setBrief({ ...brief, title: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="date">
                Date
              </label>
              <input id="date" type="date" className="input" value={brief.date} onChange={(e) => setBrief({ ...brief, date: e.target.value })} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="label" htmlFor="desc">
                What happened?
              </label>
              <button onClick={dictate} className={cn("chip mb-1.5", listening && "chip-on")}>
                <Mic size={12} /> {listening ? "Listening…" : "Voice note"}
              </button>
            </div>
            <textarea
              id="desc"
              rows={3}
              className="input"
              placeholder="Pumpkin carving, apple bobbing and a costume parade…"
              value={brief.description}
              onChange={(e) => setBrief({ ...brief, description: e.target.value })}
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {EVENT_TEMPLATES[brief.type].prompts.map((p) => (
                <span key={p} className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[11px] text-muted">
                  {p}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="label">Highlights & special moments</p>
            <div className="space-y-2">
              {brief.highlights.map((h, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="input"
                    placeholder={i === 0 ? "e.g. Joan, 94, won best costume" : "Another moment…"}
                    value={h}
                    onChange={(e) => setBrief({ ...brief, highlights: brief.highlights.map((x, j) => (j === i ? e.target.value : x)) })}
                  />
                  {brief.highlights.length > 1 && (
                    <button onClick={() => setBrief({ ...brief, highlights: brief.highlights.filter((_, j) => j !== i) })} className="rounded-full p-2 text-muted hover:bg-black/5" aria-label="Remove">
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              {brief.highlights.length < 6 && (
                <button onClick={() => setBrief({ ...brief, highlights: [...brief.highlights, ""] })} className="chip">
                  <Plus size={12} /> Add highlight
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="visitors">
              Visitors / partners (optional)
            </label>
            <input id="visitors" className="input" placeholder="e.g. St Mary's School choir" value={brief.visitors ?? ""} onChange={(e) => setBrief({ ...brief, visitors: e.target.value })} />
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-semibold">Add photos & videos</h1>
          <p className="mt-1 text-muted">Add everything, even the blurry ones. The ingest agent picks the best moments.</p>
          <button
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFiles(e.dataTransfer.files);
            }}
            className="mt-6 flex w-full flex-col items-center rounded-[28px] border-2 border-dashed border-brand/30 bg-brand-soft/40 px-6 py-12 text-center transition hover:bg-brand-soft"
          >
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand text-white">
              <ImagePlus />
            </span>
            <p className="mt-3 font-semibold">Tap to choose, or drag & drop</p>
            <p className="text-sm text-muted">JPG, PNG, HEIC, MP4, MOV. Up to 200 files.</p>
          </button>
          <input ref={fileRef} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
          {uploading > 0 && (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted">
              <Loader2 size={16} className="animate-spin" /> Processing {uploading} file(s)…
            </p>
          )}
          {assets.length > 0 && (
            <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
              {assets.map((a) => (
                <div key={a.id} className="group relative">
                  <MediaThumb asset={a} className="aspect-square rounded-2xl" />
                  <button
                    onClick={() => setMediaIds((ids) => ids.filter((x) => x !== a.id))}
                    className="absolute top-1.5 right-1.5 hidden rounded-full bg-black/60 p-1 text-white group-hover:block"
                    aria-label="Remove"
                  >
                    <X size={12} />
                  </button>
                  {a.brightness < 0.18 && <span className="absolute bottom-1.5 left-1.5 rounded-full bg-amber-500 px-1.5 text-[10px] font-semibold text-white">Dark</span>}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {step === 2 && (
        <section className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-semibold">
                <ShieldCheck className="text-brand" /> Consent check
              </h1>
              <p className="mt-1 max-w-xl text-muted">
                Tap each photo and tag who's in it. Anyone without social consent is blurred or held back. Nothing is shared without consent.
              </p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="badge bg-emerald-100 text-emerald-800">{cleared} cleared</span>
              {needBlur > 0 && <span className="badge bg-amber-100 text-amber-800">{needBlur} need blur</span>}
              <span className="badge bg-red-100 text-red-800">{assets.length - cleared - needBlur} excluded</span>
            </div>
          </div>
          {uploading > 0 && (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted">
              <Loader2 size={16} className="animate-spin" /> Preparing demo media…
            </p>
          )}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {assets.map((a) => (
              <button key={a.id} onClick={() => setEditing(a.id)} className="card group overflow-hidden text-left transition hover:-translate-y-0.5">
                <div className="relative">
                  <MediaThumb asset={a} className={cn("aspect-[4/3]", decisions[a.id] === "excluded" && "opacity-40 grayscale")} />
                  <span className="absolute top-2 left-2">
                    <DecisionBadge d={decisions[a.id]} />
                  </span>
                  {a.starred && <Star size={16} className="absolute top-2 right-2 fill-amber-400 text-amber-400" />}
                </div>
                <div className="p-3">
                  <p className="truncate text-xs text-muted">
                    {a.residentIds.length ? a.residentIds.map((id) => residents.find((r) => r.id === id)?.name.split(" ")[0]).join(", ") : "No residents tagged"}
                    {a.unknownPeople && " · + others"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="mx-auto max-w-4xl space-y-7">
          <h1 className="text-3xl font-semibold">How should we tell it?</h1>
          <div>
            <p className="label">Format</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(
                [
                  ["reel", "Reel / Short", "9:16 video"],
                  ["carousel", "Carousel", "Up to 10 slides"],
                  ["single", "Single post", "One hero image"],
                  ["story", "Story", "15s vertical"],
                ] as [Format, string, string][]
              ).map(([id, l, d]) => (
                <button key={id} onClick={() => setFormat(id)} className={cn("rounded-2xl border p-4 text-left transition", format === id ? "border-brand bg-brand-soft" : "border-line bg-white")}>
                  <p className="font-semibold">{l}</p>
                  <p className="text-xs text-muted">{d}</p>
                </button>
              ))}
            </div>
          </div>
          {format === "reel" && (
            <div>
              <p className="label">Length</p>
              <div className="flex gap-2">
                {([15, 30, 45, 60] as ReelLength[]).map((l) => (
                  <button key={l} onClick={() => setLength(l)} className={cn("chip px-5 py-2 text-sm", length === l && "chip-on")}>
                    {l}s
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="label">Style</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(STYLE_PRESETS) as Style[]).map((s) => (
                <button key={s} onClick={() => setStyle(s)} className={cn("rounded-2xl border p-4 text-left transition", style === s ? "border-brand bg-brand-soft" : "border-line bg-white")}>
                  <p className="font-semibold">{STYLE_PRESETS[s].label}</p>
                  <p className="text-xs text-muted">{STYLE_PRESETS[s].desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="label">Platforms</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatforms((ps) => (ps.includes(p.id) ? ps.filter((x) => x !== p.id) : [...ps, p.id]))}
                  className={cn("chip py-2", platforms.includes(p.id) && "chip-on")}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4 text-sm text-muted ring-1 ring-line">
            Using brand kit <b className="text-ink">{brand.homeName}</b>: {brand.tone} tone, {brand.musicMood.toLowerCase()} music, CTA “{brand.cta}”.
          </div>
        </section>
      )}

      {step === 4 && <AgentRun input={pipelineInput} onResult={onResult} onBack={() => setStep(2)} />}

      {step < 4 && (
        <div className="fixed inset-x-0 bottom-16 z-20 border-t border-line bg-[var(--bg)]/95 p-3 backdrop-blur lg:bottom-0 lg:left-64">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
            <p className="hidden text-sm text-muted sm:block">
              {step === 2 && cleared === 0 ? "Tag at least one cleared photo to continue" : `Step ${step + 1} of ${STEPS.length}`}
            </p>
            <button onClick={next} disabled={!canNext} className={cn(step === 3 ? "btn-accent" : "btn-primary", "w-full sm:w-auto")}>
              {step === 3 ? "Create my story" : "Continue"} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {editing && media[editing] && <ConsentEditor asset={media[editing]} onClose={() => setEditing(null)} />}
    </div>
  );
}

interface SpeechRecognitionLike {
  lang: string;
  onresult: (e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void;
  onend: () => void;
  start: () => void;
}
