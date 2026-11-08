"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import type { ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Empty, PageHeader } from "@/components/ui";
import { ProjectGrid } from "@/components/ProjectGrid";

const FILTERS: (ProjectStatus | "all")[] = ["all", "draft", "pending_approval", "approved", "scheduled", "published", "removed"];

export default function LibraryPage() {
  const { projects } = useStore();
  const [f, setF] = useState<(typeof FILTERS)[number]>("all");
  const list = f === "all" ? projects : projects.filter((p) => p.status === f);
  return (
    <div>
      <PageHeader
        title="Library"
        subtitle="Every story you've made, with its status."
        action={
          <Link href="/events/new" className="btn-accent">
            <Plus size={16} /> New story
          </Link>
        }
      />
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((x) => (
          <button key={x} onClick={() => setF(x)} className={cn("chip shrink-0 capitalize", f === x && "chip-on")}>
            {x.replace("_", " ")} {x !== "all" && `(${projects.filter((p) => p.status === x).length})`}
          </button>
        ))}
      </div>
      {list.length ? <ProjectGrid projects={list} /> : <Empty title="Nothing here yet" text="Create a story from your latest activity and it will appear here." action={<Link href="/events/new?demo=1" className="btn-primary">Try the demo</Link>} />}
    </div>
  );
}
