"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, Check, Clapperboard, Loader2, Mic, PenLine, ScanSearch, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import type { AgentMessage, AgentName, PipelineInput, Storyboard } from "@/lib/types";
import { cn } from "@/lib/utils";

const AGENTS: { id: AgentName; label: string; icon: typeof Check }[] = [
  { id: "ingest", label: "Ingest agent", icon: ScanSearch },
  { id: "consent", label: "Consent guard", icon: ShieldCheck },
  { id: "research", label: "Trend researcher", icon: TrendingUp },
  { id: "story", label: "Storyteller", icon: PenLine },
  { id: "director", label: "Director", icon: Clapperboard },
  { id: "production", label: "Production", icon: Mic },
  { id: "qa", label: "Quality check", icon: Sparkles },
];

type StepState = { status: "idle" | "running" | "done"; note?: string; logs: string[] };

export function AgentRun({ input, onResult, onBack }: { input: PipelineInput; onResult: (s: Storyboard) => void; onBack: () => void }) {
  const [steps, setSteps] = useState<Record<AgentName, StepState>>(
    () => Object.fromEntries(AGENTS.map((a) => [a.id, { status: "idle", logs: [] }])) as unknown as Record<AgentName, StepState>,
  );
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const res = await fetch("/api/agents/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
        if (!res.ok || !res.body) throw new Error("Request failed");
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            const m = JSON.parse(line) as AgentMessage;
            if (m.type === "step") setSteps((s) => ({ ...s, [m.agent]: { ...s[m.agent], status: m.status, note: m.note } }));
            if (m.type === "log") setSteps((s) => ({ ...s, [m.agent]: { ...s[m.agent], logs: [...s[m.agent].logs, m.note] } }));
            if (m.type === "error") setError(m.message);
            if (m.type === "result") setTimeout(() => onResult(m.storyboard), 500);
          }
        }
      } catch {
        setError("Couldn't reach the agents. Check your connection and try again.");
      }
    })();
  }, [input, onResult]);

  const doneCount = AGENTS.filter((a) => steps[a.id].status === "done").length;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-semibold">Your story is being made</h2>
        <p className="mt-1 text-sm text-muted">Seven agents are working on “{input.brief.title}”. This usually takes under a minute.</p>
        <div className="mx-auto mt-4 h-2 max-w-sm overflow-hidden rounded-full bg-black/5">
          <motion.div className="h-full bg-brand" animate={{ width: `${(doneCount / AGENTS.length) * 100}%` }} />
        </div>
      </div>
      <ol className="card divide-y divide-line">
        {AGENTS.map((a) => {
          const s = steps[a.id];
          return (
            <motion.li key={a.id} layout className="flex gap-4 p-4">
              <span
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-2xl transition",
                  s.status === "done" ? "bg-brand text-white" : s.status === "running" ? "bg-accent-soft text-accent" : "bg-black/5 text-muted",
                )}
              >
                {s.status === "done" ? <Check size={18} /> : s.status === "running" ? <Loader2 size={18} className="animate-spin" /> : <a.icon size={18} />}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className={cn("text-sm font-semibold", s.status === "idle" && "text-muted")}>{a.label}</p>
                {s.note && <p className="text-sm text-muted">{s.note}</p>}
                {s.logs.map((l, i) => (
                  <p key={i} className="mt-1 text-xs text-brand">
                    → {l}
                  </p>
                ))}
              </div>
            </motion.li>
          );
        })}
      </ol>
      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p>{error}</p>
            <button onClick={onBack} className="mt-2 font-semibold underline">
              Go back and fix
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
