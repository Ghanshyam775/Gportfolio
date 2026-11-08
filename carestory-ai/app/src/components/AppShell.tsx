"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCheck,
  Home,
  Library,
  Palette,
  Plus,
  ScrollText,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

const NAV = [
  { href: "/", label: "Today", icon: Home },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/library", label: "Library", icon: Library },
  { href: "/approvals", label: "Approvals", icon: CheckCheck },
  { href: "/residents", label: "Consent", icon: ShieldCheck },
  { href: "/brand", label: "Brand kit", icon: Palette },
  { href: "/audit", label: "Audit log", icon: ScrollText },
  { href: "/settings", label: "Settings", icon: Settings },
];

const MOBILE = [NAV[0], NAV[1], { href: "/events/new", label: "Create", icon: Plus }, NAV[3], NAV[4]];

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.svg" alt="" className="h-8 w-8" />
      <span className="display text-lg font-semibold">
        CareStory<span className="text-accent"> AI</span>
      </span>
    </span>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [mounted, setMounted] = useState(false);
  const { role, setRole, projects, brand } = useStore();
  useEffect(() => setMounted(true), []);
  const pending = projects.filter((p) => p.status === "pending_approval").length;
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-white/70 p-5 backdrop-blur lg:flex">
        <Link href="/">
          <Logo />
        </Link>
        <Link href="/events/new" className="btn-accent mt-8 w-full">
          <Plus size={18} /> New story
        </Link>
        <nav className="mt-6 flex flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                active(n.href) ? "bg-brand-soft text-brand" : "text-muted hover:bg-black/[0.03] hover:text-ink",
              )}
            >
              <n.icon size={18} />
              {n.label}
              {n.href === "/approvals" && mounted && pending > 0 && (
                <span className="ml-auto rounded-full bg-accent px-2 text-[11px] font-bold text-white">{pending}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl border border-line bg-white p-3">
          <p className="truncate text-sm font-semibold">{mounted ? brand.homeName : "…"}</p>
          <label className="mt-2 block text-[11px] font-semibold tracking-wide text-muted uppercase" htmlFor="role">
            Viewing as
          </label>
          <select
            id="role"
            value={mounted ? role : "manager"}
            onChange={(e) => setRole(e.target.value as Role)}
            className="mt-1 w-full rounded-xl border border-line bg-white px-2 py-1.5 text-sm"
          >
            <option value="coordinator">Activity Coordinator</option>
            <option value="manager">Home Manager</option>
            <option value="group_admin">Group Admin</option>
          </select>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-[var(--bg)]/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/">
          <Logo />
        </Link>
        <Link href="/settings" aria-label="Settings" className="rounded-full p-2 hover:bg-black/5">
          <Settings size={20} />
        </Link>
      </header>

      <main className="px-4 pt-5 pb-28 sm:px-6 lg:ml-64 lg:px-10 lg:pt-10 lg:pb-12">
        <div className="mx-auto max-w-6xl">{mounted ? children : <div className="h-64 animate-pulse rounded-3xl bg-black/[0.03]" />}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {MOBILE.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={cn("flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium", active(n.href) ? "text-brand" : "text-muted")}
          >
            {n.label === "Create" ? (
              <span className="-mt-6 grid h-12 w-12 place-items-center rounded-full bg-accent text-white shadow-lg">
                <n.icon size={22} />
              </span>
            ) : (
              <n.icon size={20} />
            )}
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
