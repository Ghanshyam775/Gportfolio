"use client";

import { Film, ImageIcon, Video } from "lucide-react";
import type { ConsentDecision, MediaAsset, ProjectStatus } from "@/lib/types";
import { useMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between lg:mb-8">
      <div>
        <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-muted sm:text-base">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function MediaThumb({ asset, className, blur = true }: { asset?: MediaAsset; className?: string; blur?: boolean }) {
  const url = useMediaUrl(asset?.id);
  return (
    <div className={cn("relative overflow-hidden bg-black/5", className)}>
      {url && asset?.kind === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={asset.name} className="h-full w-full object-cover" />
      )}
      {url && asset?.kind === "video" && <video src={url} muted playsInline className="h-full w-full object-cover" />}
      {!url && (
        <div className="grid h-full w-full place-items-center text-muted">
          <ImageIcon size={20} />
        </div>
      )}
      {blur &&
        asset?.blurBoxes.map((b, i) => (
          <div
            key={i}
            className="absolute rounded-[30%] backdrop-blur-md"
            style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.w * 100}%`, height: `${b.h * 100}%` }}
          />
        ))}
      {asset?.kind === "video" && (
        <span className="absolute right-1.5 bottom-1.5 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
          <Video size={10} /> {asset.duration?.toFixed(0)}s
        </span>
      )}
    </div>
  );
}

const STATUS: Record<ProjectStatus, [string, string]> = {
  draft: ["Draft", "bg-black/5 text-muted"],
  pending_approval: ["Awaiting approval", "bg-amber-100 text-amber-800"],
  approved: ["Approved", "bg-emerald-100 text-emerald-800"],
  scheduled: ["Scheduled", "bg-sky-100 text-sky-800"],
  published: ["Published", "bg-brand-soft text-brand"],
  removed: ["Removed (consent)", "bg-red-100 text-red-800"],
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const [l, c] = STATUS[status];
  return <span className={cn("badge", c)}>{l}</span>;
}

export function DecisionBadge({ d }: { d: ConsentDecision }) {
  const map = { ok: ["Cleared", "bg-emerald-500"], needs_blur: ["Blur needed", "bg-amber-500"], excluded: ["Excluded", "bg-red-500"] } as const;
  return <span className={cn("badge text-white shadow", map[d][1])}>{map[d][0]}</span>;
}

export function Empty({ icon: Icon = Film, title, text, action }: { icon?: typeof Film; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand">
        <Icon />
      </span>
      <h3 className="mt-4 text-xl font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
