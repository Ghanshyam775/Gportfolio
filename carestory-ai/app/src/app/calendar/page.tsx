"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { AWARENESS_DAYS, EVENT_TEMPLATES } from "@/lib/ai/knowledge";
import type { EventType } from "@/lib/types";
import { cn, uid } from "@/lib/utils";
import { PageHeader } from "@/components/ui";

const pad = (n: number) => String(n).padStart(2, "0");
const key = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default function CalendarPage() {
  const { events, projects, addEvent, deleteEvent } = useStore();
  const [cursor, setCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [adding, setAdding] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", type: "other" as EventType });

  const days = useMemo(() => {
    const start = new Date(cursor);
    start.setDate(1 - ((start.getDay() + 6) % 7)); // Monday start
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const today = key(new Date());
  const byDay = (k: string) => ({
    events: events.filter((e) => e.brief.date === k),
    posts: projects.filter((p) => p.scheduledAt && key(new Date(p.scheduledAt)) === k && p.status !== "removed"),
    aware: AWARENESS_DAYS.filter((a) => `${pad(a.m)}-${pad(a.d)}` === k.slice(5)),
  });

  const save = () => {
    if (!adding || !form.title.trim()) return;
    addEvent({ id: uid("e"), homeId: "h1", status: "planned", createdAt: new Date().toISOString(), mediaIds: [], brief: { type: form.type, title: form.title, date: adding, description: "", highlights: [] } });
    setAdding(null);
    setForm({ title: "", type: "other" });
  };

  return (
    <div>
      <PageHeader
        title="Content calendar"
        subtitle="Plan activities, see scheduled posts, and never miss an awareness day."
        action={
          <button onClick={() => setAdding(today)} className="btn-primary">
            <Plus size={16} /> Plan event
          </button>
        }
      />
      <div className="card p-3 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</h2>
          <div className="flex gap-1">
            <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="rounded-full p-2 hover:bg-black/5" aria-label="Previous month">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => setCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))} className="chip">
              Today
            </button>
            <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="rounded-full p-2 hover:bg-black/5" aria-label="Next month">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-line bg-line text-xs">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="bg-white p-2 text-center font-semibold text-muted">
              {d}
            </div>
          ))}
          {days.map((d) => {
            const k = key(d);
            const { events: ev, posts, aware } = byDay(k);
            const inMonth = d.getMonth() === cursor.getMonth();
            return (
              <div
                key={k}
                onClick={() => setAdding(k)}
                className={cn("min-h-20 cursor-pointer bg-white p-1.5 transition hover:bg-brand-soft/40 sm:min-h-28", !inMonth && "bg-white/60 text-muted/50")}
              >
                <span className={cn("inline-grid h-6 w-6 place-items-center rounded-full font-semibold", k === today && "bg-accent text-white")}>{d.getDate()}</span>
                <div className="mt-1 space-y-1">
                  {aware.map((a) => (
                    <p key={a.name} className="truncate rounded-md bg-[var(--gold)]/30 px-1 py-0.5 text-[10px] text-amber-900" title={a.tip}>
                      ✦ {a.name}
                    </p>
                  ))}
                  {ev.map((e) => (
                    <Link
                      key={e.id}
                      href={`/events/new?from=${e.id}`}
                      onClick={(x) => x.stopPropagation()}
                      className="block truncate rounded-md bg-accent-soft px-1 py-0.5 text-[10px] font-medium text-accent"
                      title={e.brief.title}
                    >
                      {EVENT_TEMPLATES[e.brief.type].emoji} {e.brief.title}
                    </Link>
                  ))}
                  {posts.map((p) => (
                    <Link key={p.id} href={`/projects/${p.id}`} onClick={(x) => x.stopPropagation()} className="block truncate rounded-md bg-brand px-1 py-0.5 text-[10px] font-medium text-white">
                      ▶ {events.find((e) => e.id === p.eventId)?.brief.title ?? "Post"}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <i className="h-2.5 w-2.5 rounded bg-accent-soft ring-1 ring-accent/30" /> Activity
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-2.5 w-2.5 rounded bg-brand" /> Scheduled post
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-2.5 w-2.5 rounded bg-[var(--gold)]/50" /> Awareness day
          </span>
        </div>
      </div>

      {adding && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center" onClick={() => setAdding(null)}>
          <div className="w-full max-w-md rounded-t-[28px] bg-white p-6 sm:rounded-[28px]" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Plan event">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Plan an activity</h2>
              <button onClick={() => setAdding(null)} className="rounded-full p-2 hover:bg-black/5" aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <input type="date" className="input" value={adding} onChange={(e) => setAdding(e.target.value)} aria-label="Date" />
              <input className="input" placeholder="e.g. Afternoon tea with the WI" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} aria-label="Title" autoFocus />
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as EventType })} aria-label="Type">
                {(Object.keys(EVENT_TEMPLATES) as EventType[]).map((t) => (
                  <option key={t} value={t}>
                    {EVENT_TEMPLATES[t].emoji} {EVENT_TEMPLATES[t].label}
                  </option>
                ))}
              </select>
              <button onClick={save} disabled={!form.title.trim()} className="btn-primary w-full">
                Add to calendar
              </button>
              {byDay(adding).events.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-xl bg-black/[0.03] px-3 py-2 text-sm">
                  <span className="truncate">{e.brief.title}</span>
                  <button onClick={() => deleteEvent(e.id)} className="text-xs text-red-700">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
