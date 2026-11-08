"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleDashed, Link2, RotateCcw } from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/ui";

type Status = { capability: string; env: string; configured: boolean; active: string };

const SOCIALS = ["Instagram", "Facebook Page", "TikTok", "YouTube", "LinkedIn", "Google Business Profile"];

export default function SettingsPage() {
  const { reset, requireApproval, setRequireApproval } = useStore();
  const [providers, setProviders] = useState<Status[]>([]);
  useEffect(() => {
    fetch("/api/providers")
      .then((r) => r.json())
      .then(setProviders)
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="AI providers, social accounts and workspace options." />

      <section className="card p-5">
        <h2 className="text-lg font-semibold">AI providers</h2>
        <p className="mt-1 text-sm text-muted">
          Add API keys as server environment variables (see <code>.env.example</code>). Until then, built-in mock agents keep the full flow working.
        </p>
        <div className="mt-4 divide-y divide-line">
          {providers.map((p) => (
            <div key={p.capability} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                {p.configured ? <CheckCircle2 size={16} className="text-emerald-600" /> : <CircleDashed size={16} className="text-muted" />}
                <span className="text-sm font-semibold">{p.capability}</span>
              </div>
              <div className="text-xs text-muted sm:text-right">
                <code className="rounded bg-black/[0.04] px-1.5 py-0.5">{p.env}</code>
                <span className="ml-2">Active: {p.active}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">Social accounts</h2>
        <p className="mt-1 text-sm text-muted">Auto-publishing turns on once platform app reviews are approved. For now, download each story and post it yourself.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SOCIALS.map((s) => (
            <div key={s} className="flex items-center justify-between rounded-2xl border border-line bg-white px-4 py-3">
              <span className="text-sm font-medium">{s}</span>
              <button disabled className="chip">
                <Link2 size={12} /> Connect
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">Workspace</h2>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={requireApproval} onChange={(e) => setRequireApproval(e.target.checked)} className="accent-[var(--brand)]" />
          Require manager approval before anything is scheduled
        </label>
        <button
          onClick={() => {
            if (confirm("Reset all demo data on this device? Stories, events and consent changes will be lost.")) reset();
          }}
          className="btn-ghost mt-4 text-red-700"
        >
          <RotateCcw size={16} /> Reset demo data
        </button>
        <p className="mt-2 text-xs text-muted">
          Prototype storage: data stays in this browser. Production uses UK-hosted Postgres and S3 (London region).
        </p>
      </section>
    </div>
  );
}
