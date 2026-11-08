"use client";

import Link from "next/link";
import { ArrowRight, CalendarHeart, Camera, Clock, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";
import { useStore } from "@/lib/store";
import { EVENT_TEMPLATES, upcomingAwarenessDays } from "@/lib/ai/knowledge";
import { consentExpiringSoon, hasValidConsent } from "@/lib/consent";
import { daysUntil, fmtDate } from "@/lib/utils";
import { MediaThumb, StatusBadge } from "@/components/ui";

export default function Today() {
  const { events, projects, residents, media, userName } = useStore();
  const upcoming = events
    .filter((e) => e.status === "planned" && daysUntil(e.brief.date) >= 0)
    .sort((a, b) => a.brief.date.localeCompare(b.brief.date))
    .slice(0, 4);
  const recent = projects.slice(0, 4);
  const awareness = upcomingAwarenessDays(new Date(), 3);
  const consented = residents.filter((r) => hasValidConsent(r)).length;
  const expiring = residents.filter((r) => consentExpiringSoon(r));
  const thisWeek = projects.filter((p) => Date.now() - new Date(p.createdAt).getTime() < 7 * 86_400_000).length;
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[32px] bg-brand px-6 py-10 text-white sm:px-10 sm:py-14">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-[var(--gold)]/20 blur-3xl" />
        <p className="relative text-sm font-medium text-white/70">
          {greet}, {userName.split(" ")[0]}
        </p>
        <h1 className="relative mt-2 max-w-xl text-4xl leading-tight font-semibold sm:text-5xl">What happened at the home today?</h1>
        <p className="relative mt-3 max-w-lg text-white/80">
          Drop your photos and videos. Our agents write the story, add a British voiceover and cut a cinematic reel. Consent is checked automatically.
        </p>
        <div className="relative mt-7 flex flex-wrap gap-3">
          <Link href="/events/new" className="btn bg-white text-brand hover:bg-white/90">
            <Camera size={18} /> Create from an event
          </Link>
          <Link href="/events/new?demo=1" className="btn border border-white/30 text-white hover:bg-white/10">
            <Sparkles size={18} /> Try the Halloween demo
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: TrendingUp, label: "Stories this week", value: thisWeek, hint: "Goal: 3+" },
          { icon: Clock, label: "Awaiting approval", value: projects.filter((p) => p.status === "pending_approval").length, hint: "Approvals inbox" },
          { icon: CalendarHeart, label: "Upcoming events", value: upcoming.length, hint: "Next 6 weeks" },
          { icon: ShieldAlert, label: "Residents cleared for social", value: `${consented}/${residents.length}`, hint: expiring.length ? `${expiring.length} expiring soon` : "All current" },
        ].map((s) => (
          <div key={s.label} className="card p-4 sm:p-5">
            <s.icon size={18} className="text-brand" />
            <p className="mt-3 text-2xl font-semibold sm:text-3xl">{s.value}</p>
            <p className="text-xs font-medium text-muted sm:text-sm">{s.label}</p>
            <p className="mt-1 text-[11px] text-muted/80">{s.hint}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent stories</h2>
            <Link href="/library" className="text-sm font-medium text-brand">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="card p-8 text-center text-sm text-muted">
              No stories yet. Try the Halloween demo to see the full agent flow in about a minute.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {recent.map((p) => {
                const ev = events.find((e) => e.id === p.eventId);
                const first = p.storyboard.scenes.find((s) => s.mediaId);
                return (
                  <Link key={p.id} href={`/projects/${p.id}`} className="card group flex gap-3 p-3 transition hover:-translate-y-0.5">
                    <MediaThumb asset={first?.mediaId ? media[first.mediaId] : undefined} className="h-24 w-16 shrink-0 rounded-2xl" />
                    <div className="min-w-0 py-1">
                      <p className="truncate font-semibold">{ev?.brief.title ?? "Story"}</p>
                      <p className="mt-0.5 text-xs text-muted capitalize">
                        {p.format} · {p.format === "reel" ? `${p.length}s · ` : ""}
                        {p.style}
                      </p>
                      <div className="mt-2">
                        <StatusBadge status={p.status} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-6 lg:col-span-2">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Coming up</h2>
              <Link href="/calendar" className="text-sm font-medium text-brand">
                Calendar
              </Link>
            </div>
            <div className="card divide-y divide-line">
              {upcoming.map((e) => {
                const d = daysUntil(e.brief.date);
                return (
                  <div key={e.id} className="flex items-center gap-3 p-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent-soft text-xl">
                      {EVENT_TEMPLATES[e.brief.type].emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{e.brief.title}</p>
                      <p className="text-xs text-muted">
                        {fmtDate(e.brief.date)} · {d === 0 ? "today" : `in ${d} day${d > 1 ? "s" : ""}`}
                      </p>
                    </div>
                    <Link href={`/events/new?from=${e.id}`} className="chip shrink-0" title={d > 0 ? "Create a teaser" : "Add photos"}>
                      {d > 0 ? "Teaser" : "Capture"} <ArrowRight size={12} />
                    </Link>
                  </div>
                );
              })}
              {upcoming.length === 0 && <p className="p-4 text-sm text-muted">Nothing planned. Add events in the calendar.</p>}
            </div>
          </div>
          <div>
            <h2 className="mb-3 text-xl font-semibold">Content ideas</h2>
            <div className="space-y-2">
              {awareness.map((a) => (
                <div key={a.name} className="flex items-center justify-between rounded-2xl border border-dashed border-line bg-white/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">{a.name}</p>
                    <p className="text-xs text-muted">
                      {fmtDate(a.date.toISOString(), { day: "numeric", month: "short" })} · {a.tip}
                    </p>
                  </div>
                  <Sparkles size={16} className="text-accent" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
