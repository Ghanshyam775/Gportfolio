"use client";

import { useRef, useState } from "react";
import { Eraser, Star, UserX, X } from "lucide-react";
import type { BlurBox, DignityFlag, MediaAsset } from "@/lib/types";
import { useStore } from "@/lib/store";
import { decide, hasValidConsent } from "@/lib/consent";
import { useMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { DecisionBadge } from "./ui";

const FLAGS: { id: DignityFlag; label: string }[] = [
  { id: "distress", label: "Distress / upset" },
  { id: "undress", label: "Partial undress" },
  { id: "personal_care", label: "Personal care" },
  { id: "medical", label: "Medical equipment" },
  { id: "private_room", label: "Bedroom / bathroom" },
  { id: "documents", label: "Names / documents visible" },
];

export function ConsentEditor({ asset, onClose }: { asset: MediaAsset; onClose: () => void }) {
  const { residents, updateMedia, role, log } = useStore();
  const url = useMediaUrl(asset.id);
  const box = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<BlurBox | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const decision = decide(asset, residents);
  const update = (p: Partial<MediaAsset>) => updateMedia(asset.id, p);

  const rel = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) };
  };
  const onDown = (e: React.PointerEvent) => {
    if (asset.kind !== "image") return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    start.current = rel(e);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!start.current) return;
    const p = rel(e);
    const s = start.current;
    setDraft({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) });
  };
  const onUp = () => {
    if (draft && draft.w > 0.02 && draft.h > 0.02) update({ blurBoxes: [...asset.blurBoxes, draft] });
    start.current = null;
    setDraft(null);
  };

  const toggleResident = (id: string) =>
    update({ residentIds: asset.residentIds.includes(id) ? asset.residentIds.filter((x) => x !== id) : [...asset.residentIds, id] });
  const toggleFlag = (f: DignityFlag) =>
    update({ flags: asset.flags.includes(f) ? asset.flags.filter((x) => x !== f) : [...asset.flags, f], overrideReason: undefined });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div
        className="max-h-[92dvh] w-full max-w-4xl overflow-y-auto rounded-t-[28px] bg-white p-5 sm:rounded-[28px] sm:p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Consent check"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">Who's in this {asset.kind === "video" ? "clip" : "photo"}?</h2>
            <DecisionBadge d={decision} />
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-black/5" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="grid gap-5 md:grid-cols-[1.3fr_1fr]">
          <div>
            <div
              ref={box}
              className={cn("relative touch-none overflow-hidden rounded-2xl bg-black/5 select-none", asset.kind === "image" && "cursor-crosshair")}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
            >
              {url &&
                (asset.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt="" className="pointer-events-none w-full" draggable={false} />
                ) : (
                  <video src={url} controls muted className="w-full" />
                ))}
              {[...asset.blurBoxes, ...(draft ? [draft] : [])].map((b, i) => (
                <div
                  key={i}
                  className="pointer-events-none absolute rounded-[30%] border-2 border-white/80 backdrop-blur-lg"
                  style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.w * 100}%`, height: `${b.h * 100}%` }}
                />
              ))}
            </div>
            {asset.kind === "image" ? (
              <div className="mt-2 flex items-center justify-between text-xs text-muted">
                <span>Drag over a face to blur it. Blur is permanent in every export.</span>
                {asset.blurBoxes.length > 0 && (
                  <button className="chip" onClick={() => update({ blurBoxes: [] })}>
                    <Eraser size={12} /> Clear blur
                  </button>
                )}
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted">Clips can't be region-blurred in this version. If anyone without consent appears, the clip is excluded.</p>
            )}
          </div>

          <div className="space-y-5">
            <div>
              <p className="label">Residents in shot</p>
              <div className="flex flex-wrap gap-2">
                {residents.map((r) => {
                  const ok = hasValidConsent(r);
                  const on = asset.residentIds.includes(r.id);
                  return (
                    <button
                      key={r.id}
                      onClick={() => toggleResident(r.id)}
                      className={cn("chip", on && (ok ? "chip-on" : "border-red-500 bg-red-500 text-white hover:bg-red-500"))}
                      title={ok ? "Social consent on file" : "No valid social consent"}
                    >
                      <span className={cn("h-2 w-2 rounded-full", ok ? "bg-emerald-400" : "bg-red-400")} />
                      {r.name}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => update({ unknownPeople: !asset.unknownPeople })}
                className={cn("chip mt-2", asset.unknownPeople && "border-amber-500 bg-amber-500 text-white hover:bg-amber-500")}
              >
                <UserX size={14} /> Someone else is visible (visitor, child, staff without consent)
              </button>
            </div>

            <div>
              <p className="label">Dignity check</p>
              <div className="grid grid-cols-2 gap-2">
                {FLAGS.map((f) => (
                  <label key={f.id} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-xs">
                    <input type="checkbox" checked={asset.flags.includes(f.id)} onChange={() => toggleFlag(f.id)} className="accent-[var(--bad)]" />
                    {f.label}
                  </label>
                ))}
              </div>
              {asset.flags.length > 0 && (
                <div className="mt-2 rounded-xl bg-red-50 p-3 text-xs text-red-800">
                  Flagged media is excluded.
                  {role !== "coordinator" ? (
                    <button
                      className="ml-1 font-semibold underline"
                      onClick={() => {
                        const reason = prompt("Manager override: why is this appropriate to share? (saved to the audit log)");
                        if (reason) {
                          update({ overrideReason: reason });
                          log("Dignity override", `${asset.name}: ${reason}`);
                        }
                      }}
                    >
                      {asset.overrideReason ? `Override: “${asset.overrideReason}”` : "Override as manager"}
                    </button>
                  ) : (
                    " A manager can override with a reason."
                  )}
                </div>
              )}
            </div>

            <button onClick={() => update({ starred: !asset.starred })} className={cn("chip", asset.starred && "border-amber-400 bg-amber-50")}>
              <Star size={14} className={asset.starred ? "fill-amber-400 text-amber-400" : ""} /> Must include this moment
            </button>

            <div className="rounded-2xl bg-brand-soft p-3 text-xs text-brand">
              {decision === "ok" && "Cleared for social. Everyone visible has valid consent or is blurred."}
              {decision === "needs_blur" && "Someone without social consent is visible. Blur their face, or this photo won't be used."}
              {decision === "excluded" && "This item won't be used, to protect residents."}
            </div>
            <button onClick={onClose} className="btn-primary w-full">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
