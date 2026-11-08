"use client";

import Link from "next/link";
import type { Project } from "@/lib/types";
import { useStore } from "@/lib/store";
import { fmtDate } from "@/lib/utils";
import { MediaThumb, StatusBadge } from "./ui";

export function ProjectGrid({ projects }: { projects: Project[] }) {
  const { events, media } = useStore();
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {projects.map((p) => {
        const ev = events.find((e) => e.id === p.eventId);
        const first = p.storyboard.scenes.find((s) => s.mediaId);
        return (
          <Link key={p.id} href={`/projects/${p.id}`} className="card group overflow-hidden transition hover:-translate-y-0.5">
            <div className="relative">
              <MediaThumb asset={first?.mediaId ? media[first.mediaId] : undefined} className="aspect-[4/5]" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-10">
                <p className="display line-clamp-2 text-sm font-semibold text-white">{p.storyboard.hook}</p>
              </div>
            </div>
            <div className="space-y-1.5 p-3">
              <p className="truncate text-sm font-semibold">{ev?.brief.title ?? "Story"}</p>
              <p className="text-xs text-muted capitalize">
                {p.format}
                {p.format === "reel" && ` · ${p.length}s`} · {fmtDate(p.createdAt, { day: "numeric", month: "short" })}
              </p>
              <StatusBadge status={p.status} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
