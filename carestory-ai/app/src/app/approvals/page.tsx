"use client";

import { CheckCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { Empty, PageHeader } from "@/components/ui";
import { ProjectGrid } from "@/components/ProjectGrid";

export default function ApprovalsPage() {
  const { projects, role, requireApproval, setRequireApproval } = useStore();
  const pending = projects.filter((p) => p.status === "pending_approval");
  return (
    <div>
      <PageHeader
        title="Approvals"
        subtitle={role === "coordinator" ? "Stories waiting for your manager." : "Check each story before it goes out. Consent is re-checked when you approve."}
        action={
          role !== "coordinator" && (
            <label className="flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm">
              <input type="checkbox" checked={requireApproval} onChange={(e) => setRequireApproval(e.target.checked)} className="accent-[var(--brand)]" />
              Manager approval required
            </label>
          )
        }
      />
      {pending.length ? <ProjectGrid projects={pending} /> : <Empty icon={CheckCheck} title="All caught up" text="No stories are waiting for approval." />}
    </div>
  );
}
