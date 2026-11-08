"use client";

import { Download, ScrollText } from "lucide-react";
import { useStore } from "@/lib/store";
import { fmtDateTime } from "@/lib/utils";
import { Empty, PageHeader } from "@/components/ui";

export default function AuditPage() {
  const { audit } = useStore();
  const exportCsv = () => {
    const rows = [["Time", "Who", "Action", "Detail"], ...audit.map((a) => [a.at, a.actor, a.action, a.detail ?? ""])];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "carestory-audit-log.csv";
    a.click();
  };
  return (
    <div>
      <PageHeader
        title="Audit log"
        subtitle="Every consent decision, override, approval and takedown, ready for CQC inspections or family questions."
        action={
          audit.length > 0 && (
            <button onClick={exportCsv} className="btn-ghost">
              <Download size={16} /> Export CSV
            </button>
          )
        }
      />
      {audit.length === 0 ? (
        <Empty icon={ScrollText} title="No activity yet" text="Actions appear here as your team uses CareStory." />
      ) : (
        <div className="card divide-y divide-line">
          {audit.map((a) => (
            <div key={a.id} className="flex flex-col gap-0.5 p-4 sm:flex-row sm:items-center sm:gap-4">
              <span className="w-36 shrink-0 text-xs text-muted tabular-nums">{fmtDateTime(a.at)}</span>
              <span className="text-sm font-semibold">{a.action}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-muted">{a.detail}</span>
              <span className="text-xs text-muted">{a.actor}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
