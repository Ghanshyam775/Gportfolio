"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowDown, ArrowLeft, ArrowUp, CalendarClock, Check, CheckCircle2, Copy, MessageSquare, Plus, Send, Sparkles, Trash2, XCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { decide } from "@/lib/consent";
import { MUSIC_MOODS, VOICES } from "@/lib/ai/knowledge";
import type { Motion, Platform, Scene, Storyboard } from "@/lib/types";
import { cn, fmtDateTime, uid } from "@/lib/utils";
import { totalDuration } from "@/lib/render/renderer";
import { ReelPlayer } from "@/components/ReelPlayer";
import { Slides } from "@/components/Slides";
import { Empty, MediaThumb, StatusBadge } from "@/components/ui";

const MOTIONS: { id: Motion; label: string }[] = [
  { id: "zoom_in", label: "Push in" },
  { id: "zoom_out", label: "Pull out" },
  { id: "pan_left", label: "Pan left" },
  { id: "pan_right", label: "Pan right" },
  { id: "still", label: "Still" },
];

const PLATFORM_LABEL: Record<Platform, string> = { instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", youtube: "YouTube Shorts", linkedin: "LinkedIn", google: "Google Business" };

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { projects, events, media, residents, brand, role, requireApproval, updateProject, log } = useStore();
  const project = projects.find((p) => p.id === id);
  const event = events.find((e) => e.id === project?.eventId);
  const [tab, setTab] = useState<"story" | "captions" | "details">("story");
  const [scheduleAt, setScheduleAt] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const sb = project?.storyboard;
  const playerBrand = useMemo(() => ({ ...brand, voiceId: sb?.voiceId ?? brand.voiceId }), [brand, sb?.voiceId]);
  if (!project || !sb) return <Empty title="Story not found" text="It may have been removed." action={<Link href="/library" className="btn-primary">Library</Link>} />;

  const blocked = sb.scenes.filter((s) => s.mediaId && (!media[s.mediaId] || decide(media[s.mediaId], residents) !== "ok"));
  const clearedMedia = (event?.mediaIds ?? []).filter((m) => media[m] && decide(media[m], residents) === "ok");
  const isVideo = project.format === "reel" || project.format === "story";
  const locked = project.status === "removed" || project.status === "published";
  const isManager = role !== "coordinator";

  const setSb = (p: Partial<Storyboard>) => updateProject(project.id, { storyboard: { ...sb, ...p }, ...(project.status === "approved" ? { status: "draft" as const } : {}) });
  const setScene = (sid: string, p: Partial<Scene>) => setSb({ scenes: sb.scenes.map((s) => (s.id === sid ? { ...s, ...p } : s)) });
  const move = (i: number, d: number) => {
    const arr = [...sb.scenes];
    const j = i + d;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setSb({ scenes: arr });
  };
  const addScene = () => {
    const m = clearedMedia[0];
    if (!m) return;
    const scene: Scene = { id: uid("s"), kind: "media", mediaId: m, duration: 2.5, overlay: "", voiceover: "", motion: "zoom_in" };
    const outroIdx = sb.scenes.findIndex((s) => s.kind === "outro");
    const arr = [...sb.scenes];
    arr.splice(outroIdx === -1 ? arr.length : outroIdx, 0, scene);
    setSb({ scenes: arr });
  };

  const submit = () => {
    updateProject(project.id, { status: requireApproval && !isManager ? "pending_approval" : "approved", approvedBy: requireApproval && !isManager ? undefined : "self", changeRequest: undefined });
    log(requireApproval && !isManager ? "Submitted for approval" : "Approved", event?.brief.title);
  };
  const approve = () => {
    updateProject(project.id, { status: "approved", approvedBy: useStore.getState().userName, changeRequest: undefined });
    log("Approved", event?.brief.title);
  };
  const requestChanges = () => {
    const c = prompt("What should change?");
    if (!c) return;
    updateProject(project.id, { status: "draft", changeRequest: c });
    log("Changes requested", `${event?.brief.title}: ${c}`);
  };
  const schedule = () => {
    if (!scheduleAt) return;
    updateProject(project.id, { status: "scheduled", scheduledAt: new Date(scheduleAt).toISOString() });
    log("Scheduled", `${event?.brief.title} → ${project.platforms.join(", ")} at ${fmtDateTime(new Date(scheduleAt).toISOString())}`);
  };
  const markPublished = () => {
    updateProject(project.id, { status: "published" });
    log("Marked as published", event?.brief.title);
  };
  const copy = async (p: Platform, text: string) => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(p);
    setTimeout(() => setCopied(null), 1500);
  };

  const fileName = (event?.brief.title ?? "story").toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <Link href="/library" className="mt-1 rounded-full p-2 hover:bg-black/5" aria-label="Back">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold sm:text-3xl">{event?.brief.title ?? "Story"}</h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="mt-1 text-sm text-muted capitalize">
              {project.format}
              {isVideo && ` · ${totalDuration(sb.scenes).toFixed(0)}s`} · {project.style} · “{sb.trend}” format
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {project.status === "draft" && (
            <button onClick={submit} disabled={blocked.length > 0} className="btn-primary">
              <Send size={16} /> {requireApproval && !isManager ? "Send for approval" : "Approve"}
            </button>
          )}
          {project.status === "pending_approval" && isManager && (
            <>
              <button onClick={requestChanges} className="btn-ghost">
                <MessageSquare size={16} /> Request changes
              </button>
              <button onClick={approve} disabled={blocked.length > 0} className="btn-primary">
                <Check size={16} /> Approve
              </button>
            </>
          )}
          {project.status === "approved" && (
            <div className="flex flex-wrap gap-2">
              <input type="datetime-local" className="input w-auto py-2" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} aria-label="Schedule time" />
              <button onClick={schedule} disabled={!scheduleAt} className="btn-primary">
                <CalendarClock size={16} /> Schedule
              </button>
            </div>
          )}
          {project.status === "scheduled" && (
            <button onClick={markPublished} className="btn-primary">
              <CheckCircle2 size={16} /> Mark as posted
            </button>
          )}
        </div>
      </div>

      {project.status === "removed" && (
        <Banner tone="bad" icon={XCircle}>
          Removed because a resident withdrew consent. It can't be edited or published again.
        </Banner>
      )}
      {blocked.length > 0 && project.status !== "removed" && (
        <Banner tone="bad" icon={AlertTriangle}>
          {blocked.length} scene(s) use media that's no longer cleared (consent changed). Swap or delete them before approving.
        </Banner>
      )}
      {project.changeRequest && (
        <Banner tone="warn" icon={MessageSquare}>
          Manager asked for changes: “{project.changeRequest}”
        </Banner>
      )}
      {project.status === "scheduled" && project.scheduledAt && (
        <Banner tone="ok" icon={CalendarClock}>
          Scheduled for {fmtDateTime(project.scheduledAt)} on {project.platforms.map((p) => PLATFORM_LABEL[p]).join(", ")}. Auto-publishing turns on once social accounts are connected in Settings. Until then, download and post it yourself.
        </Banner>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(340px,auto)_1fr]">
        <div className="lg:sticky lg:top-8 lg:self-start">
          <div className="card flex flex-col items-center p-5">
            {isVideo ? (
              <ReelPlayer scenes={sb.scenes} media={media} brand={playerBrand} style={project.style} fileName={fileName} onExported={() => log("Exported video", event?.brief.title)} />
            ) : (
              <Slides scenes={sb.scenes} media={media} brand={brand} style={project.style} fileName={fileName} />
            )}
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-4 flex gap-1 rounded-full bg-black/[0.04] p-1">
            {(["story", "captions", "details"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={cn("flex-1 rounded-full py-2 text-sm font-semibold capitalize transition", tab === t ? "bg-white shadow-sm" : "text-muted")}>
                {t === "story" ? "Storyboard" : t}
              </button>
            ))}
          </div>

          {tab === "story" && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-accent-soft p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-accent uppercase">
                  <Sparkles size={12} /> Hook
                </p>
                <p className="display mt-1 text-lg">{sb.hook}</p>
              </div>
              {sb.scenes.map((s, i) => (
                <div key={s.id} className={cn("card p-4", s.mediaId && blocked.includes(s) && "ring-2 ring-red-400")}>
                  <div className="flex gap-3">
                    {s.kind === "media" ? (
                      <MediaThumb asset={s.mediaId ? media[s.mediaId] : undefined} className="h-24 w-[4.5rem] shrink-0 rounded-xl" />
                    ) : (
                      <div className="grid h-24 w-[4.5rem] shrink-0 place-items-center rounded-xl text-center text-[10px] font-bold text-white uppercase" style={{ background: brand.primary }}>
                        {s.kind === "title" ? "Title" : "Outro"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-muted">
                          Scene {i + 1}
                          {s.aiMotion && <span className="ml-2 badge bg-violet-100 text-violet-700">AI motion</span>}
                        </span>
                        {!locked && (
                          <div className="flex gap-0.5">
                            <IconBtn onClick={() => move(i, -1)} label="Move up">
                              <ArrowUp size={14} />
                            </IconBtn>
                            <IconBtn onClick={() => move(i, 1)} label="Move down">
                              <ArrowDown size={14} />
                            </IconBtn>
                            {s.kind === "media" && (
                              <IconBtn onClick={() => setSb({ scenes: sb.scenes.filter((x) => x.id !== s.id) })} label="Delete">
                                <Trash2 size={14} />
                              </IconBtn>
                            )}
                          </div>
                        )}
                      </div>
                      <input disabled={locked} className="input py-2 font-semibold" value={s.overlay} placeholder="On-screen text" onChange={(e) => setScene(s.id, { overlay: e.target.value })} aria-label="On-screen text" />
                      {isVideo && (
                        <textarea disabled={locked} rows={2} className="input py-2" value={s.voiceover} placeholder="Voiceover line" onChange={(e) => setScene(s.id, { voiceover: e.target.value })} aria-label="Voiceover" />
                      )}
                      {isVideo && (
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <label className="flex items-center gap-1 text-muted">
                            <input
                              disabled={locked}
                              type="number"
                              step={0.5}
                              min={1}
                              max={10}
                              value={s.duration}
                              onChange={(e) => setScene(s.id, { duration: Math.max(1, Math.min(10, +e.target.value || 1)) })}
                              className="w-16 rounded-lg border border-line px-2 py-1"
                            />
                            sec
                          </label>
                          {s.kind === "media" && media[s.mediaId ?? ""]?.kind === "image" && (
                            <select disabled={locked} value={s.motion} onChange={(e) => setScene(s.id, { motion: e.target.value as Motion })} className="rounded-lg border border-line px-2 py-1">
                              {MOTIONS.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.label}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                      {s.kind === "media" && !locked && clearedMedia.length > 1 && (
                        <div className="flex gap-1.5 overflow-x-auto pt-1">
                          {clearedMedia.map((m) => (
                            <button key={m} onClick={() => setScene(s.id, { mediaId: m })} className={cn("shrink-0 rounded-lg ring-2", m === s.mediaId ? "ring-brand" : "ring-transparent")} aria-label="Use this media">
                              <MediaThumb asset={media[m]} className="h-10 w-10 rounded-lg" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {!locked && clearedMedia.length > 0 && (
                <button onClick={addScene} className="btn-ghost w-full">
                  <Plus size={16} /> Add scene
                </button>
              )}
            </div>
          )}

          {tab === "captions" && (
            <div className="space-y-3">
              {sb.copy.map((c) => {
                const full = `${c.caption}${c.hashtags.length ? `\n\n${c.hashtags.join(" ")}` : ""}`;
                return (
                  <div key={c.platform} className="card p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-semibold">{PLATFORM_LABEL[c.platform]}</p>
                      <button onClick={() => copy(c.platform, full)} className="chip">
                        {copied === c.platform ? <Check size={12} /> : <Copy size={12} />} {copied === c.platform ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <textarea
                      disabled={locked}
                      rows={5}
                      className="input"
                      value={c.caption}
                      onChange={(e) => setSb({ copy: sb.copy.map((x) => (x.platform === c.platform ? { ...x, caption: e.target.value } : x)) })}
                    />
                    <input
                      disabled={locked}
                      className="input mt-2 py-2 text-brand"
                      value={c.hashtags.join(" ")}
                      onChange={(e) =>
                        setSb({ copy: sb.copy.map((x) => (x.platform === c.platform ? { ...x, hashtags: e.target.value.split(/\s+/).filter(Boolean).map((h) => (h.startsWith("#") ? h : `#${h}`)) } : x)) })
                      }
                      aria-label="Hashtags"
                    />
                    <p className="mt-1 text-right text-[11px] text-muted">{full.length} characters</p>
                  </div>
                );
              })}
              <div className="card p-4">
                <p className="label">Alt text (accessibility)</p>
                <textarea disabled={locked} rows={2} className="input" value={sb.altText} onChange={(e) => setSb({ altText: e.target.value })} />
              </div>
            </div>
          )}

          {tab === "details" && (
            <div className="space-y-4">
              {isVideo && (
                <div className="card grid gap-4 p-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Voice</label>
                    <select disabled={locked} className="input" value={sb.voiceId} onChange={(e) => setSb({ voiceId: e.target.value })}>
                      {VOICES.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Music mood</label>
                    <select disabled={locked} className="input" value={sb.musicMood} onChange={(e) => setSb({ musicMood: e.target.value })}>
                      {MUSIC_MOODS.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-muted sm:col-span-2">
                    Preview uses your browser's British voice. ElevenLabs voiceover and licensed music are added to the final render once providers are connected.
                  </p>
                </div>
              )}
              <div className="card p-4">
                <p className="label">Quality checks</p>
                <ul className="space-y-1.5">
                  {sb.qa.map((q) => (
                    <li key={q.check} className="flex items-center gap-2 text-sm">
                      {q.ok ? <CheckCircle2 size={16} className="text-emerald-600" /> : <XCircle size={16} className="text-red-500" />}
                      {q.check}
                      {q.note && <span className="text-muted">({q.note})</span>}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card p-4">
                <p className="label">Consent snapshot (at generation)</p>
                <ul className="space-y-1 text-sm">
                  {project.consentSnapshot
                    .filter((c) => c.decision === "ok")
                    .map((c) => (
                      <li key={c.mediaId} className="flex items-center gap-2">
                        <MediaThumb asset={media[c.mediaId]} className="h-8 w-8 rounded-lg" />
                        <span className="text-muted">{c.residentIds.map((r) => residents.find((x) => x.id === r)?.name).join(", ") || "No residents"}</span>
                      </li>
                    ))}
                </ul>
                <p className="mt-2 text-xs text-muted">
                  {project.consentSnapshot.filter((c) => c.decision !== "ok").length} item(s) were held back. Approved by: {project.approvedBy ?? "pending"}.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Banner({ tone, icon: Icon, children }: { tone: "ok" | "warn" | "bad"; icon: typeof Check; children: React.ReactNode }) {
  const c = tone === "ok" ? "bg-sky-50 text-sky-900" : tone === "warn" ? "bg-amber-50 text-amber-900" : "bg-red-50 text-red-800";
  return (
    <div className={cn("mb-4 flex items-start gap-3 rounded-2xl p-4 text-sm", c)}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}

function IconBtn({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className="rounded-lg p-1.5 text-muted hover:bg-black/5 hover:text-ink">
      {children}
    </button>
  );
}
