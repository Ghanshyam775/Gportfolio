"use client";

import { useState } from "react";
import { AlertTriangle, Pencil, Plus, ShieldCheck, ShieldOff, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { consentExpiringSoon, hasValidConsent } from "@/lib/consent";
import type { Channel, ConsentGivenBy, Resident } from "@/lib/types";
import { cn, fmtDate, uid } from "@/lib/utils";
import { PageHeader } from "@/components/ui";

const CHANNELS: { id: Channel; label: string }[] = [
  { id: "internal", label: "Internal" },
  { id: "website", label: "Website" },
  { id: "social", label: "Social media" },
  { id: "paid_ads", label: "Paid ads" },
];
const GIVEN: Record<ConsentGivenBy, string> = { resident: "Resident (has capacity)", lpa: "LPA (health & welfare)", best_interests: "Best-interests decision" };

export default function ResidentsPage() {
  const { residents, upsertResident, withdrawConsent } = useStore();
  const [editing, setEditing] = useState<Resident | null>(null);
  const [q, setQ] = useState("");
  const list = residents.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()));

  const withdraw = (r: Resident) => {
    if (!confirm(`Withdraw all media consent for ${r.name}? Every story featuring them is taken down straight away.`)) return;
    const n = withdrawConsent(r.id);
    alert(`${r.name}'s consent is withdrawn. ${n} story(ies) removed. When social accounts are connected, live posts are deleted automatically.`);
  };

  return (
    <div>
      <PageHeader
        title="Residents & consent"
        subtitle="One register for media consent, per channel. The consent guard checks it every time a story is made."
        action={
          <button
            onClick={() =>
              setEditing({ id: uid("r"), name: "", givenBy: "resident", recordedAt: new Date().toISOString(), consents: CHANNELS.map((c) => ({ channel: c.id, granted: false })) })
            }
            className="btn-primary"
          >
            <Plus size={16} /> Add resident
          </button>
        }
      />
      <input className="input mb-4 max-w-sm" placeholder="Search residents…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted uppercase">
              <th className="p-4 font-semibold">Resident</th>
              {CHANNELS.map((c) => (
                <th key={c.id} className="p-4 text-center font-semibold">
                  {c.label}
                </th>
              ))}
              <th className="p-4 font-semibold">Given by</th>
              <th className="p-4 font-semibold">Review</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map((r) => (
              <tr key={r.id} className={cn(r.withdrawnAt && "bg-red-50/40")}>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {hasValidConsent(r) ? <ShieldCheck size={16} className="text-emerald-600" /> : <ShieldOff size={16} className="text-red-500" />}
                    <div>
                      <p className="font-semibold">{r.name}</p>
                      <p className="text-xs text-muted">{r.room ? `Room ${r.room}` : ""}</p>
                    </div>
                  </div>
                </td>
                {CHANNELS.map((c) => {
                  const g = r.consents.find((x) => x.channel === c.id)?.granted;
                  return (
                    <td key={c.id} className="p-4 text-center">
                      <span className={cn("inline-block h-2.5 w-2.5 rounded-full", g ? "bg-emerald-500" : "bg-black/15")} aria-label={g ? "Granted" : "Not granted"} />
                    </td>
                  );
                })}
                <td className="p-4 text-xs text-muted">{GIVEN[r.givenBy]}</td>
                <td className="p-4 text-xs">
                  {r.withdrawnAt ? (
                    <span className="badge bg-red-100 text-red-800">Withdrawn {fmtDate(r.withdrawnAt, { day: "numeric", month: "short" })}</span>
                  ) : r.expiresAt ? (
                    <span className={cn("flex items-center gap-1", consentExpiringSoon(r) ? "font-semibold text-amber-700" : "text-muted")}>
                      {consentExpiringSoon(r) && <AlertTriangle size={12} />}
                      {fmtDate(r.expiresAt)}
                    </span>
                  ) : (
                    <span className="text-muted">No expiry</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setEditing(r)} className="chip">
                      <Pencil size={12} /> Edit
                    </button>
                    {!r.withdrawnAt && (
                      <button onClick={() => withdraw(r)} className="chip text-red-700">
                        Withdraw
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 max-w-3xl text-xs text-muted">
        Consent must be freely given, specific to each channel, and easy to withdraw (UK GDPR). If a resident lacks capacity, record who decided under the Mental Capacity Act 2005 (an LPA for health & welfare, or a best-interests decision). Review consent when capacity changes. Next up: a family consent portal with e-signatures.
      </p>

      {editing && (
        <ResidentModal
          resident={editing}
          onClose={() => setEditing(null)}
          onSave={(r) => {
            upsertResident({ ...r, withdrawnAt: r.consents.some((c) => c.granted) ? undefined : r.withdrawnAt, recordedAt: new Date().toISOString() });
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function ResidentModal({ resident, onClose, onSave }: { resident: Resident; onClose: () => void; onSave: (r: Resident) => void }) {
  const [r, setR] = useState(resident);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-[28px] bg-white p-6 sm:rounded-[28px]" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Resident consent">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{resident.name ? "Edit consent" : "Add resident"}</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-black/5" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-[2fr_1fr] gap-3">
            <div>
              <label className="label">Name</label>
              <input className="input" value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Room</label>
              <input className="input" value={r.room ?? ""} onChange={(e) => setR({ ...r, room: e.target.value })} />
            </div>
          </div>
          <div>
            <p className="label">Consent per channel</p>
            <div className="grid grid-cols-2 gap-2">
              {CHANNELS.map((c) => {
                const g = r.consents.find((x) => x.channel === c.id)?.granted ?? false;
                return (
                  <label key={c.id} className={cn("flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm", g ? "border-brand bg-brand-soft" : "border-line")}>
                    <input
                      type="checkbox"
                      checked={g}
                      onChange={() =>
                        setR({ ...r, consents: CHANNELS.map((ch) => ({ channel: ch.id, granted: ch.id === c.id ? !g : r.consents.find((x) => x.channel === ch.id)?.granted ?? false })) })
                      }
                      className="accent-[var(--brand)]"
                    />
                    {c.label}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Given by</label>
              <select className="input" value={r.givenBy} onChange={(e) => setR({ ...r, givenBy: e.target.value as ConsentGivenBy })}>
                {Object.entries(GIVEN).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Review date</label>
              <input
                type="date"
                className="input"
                value={r.expiresAt?.slice(0, 10) ?? ""}
                onChange={(e) => setR({ ...r, expiresAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
              />
            </div>
          </div>
          <div>
            <label className="label">Notes / evidence</label>
            <textarea rows={2} className="input" placeholder="e.g. Signed form on file, LPA reference…" value={r.notes ?? ""} onChange={(e) => setR({ ...r, notes: e.target.value })} />
          </div>
          <button disabled={!r.name.trim()} onClick={() => onSave(r)} className="btn-primary w-full">
            Save consent
          </button>
        </div>
      </div>
    </div>
  );
}
