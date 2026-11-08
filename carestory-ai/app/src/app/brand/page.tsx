"use client";

import { useMemo } from "react";
import { Upload, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { MUSIC_MOODS, VOICES } from "@/lib/ai/knowledge";
import type { BrandKit, Scene } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui";
import { ReelPlayer } from "@/components/ReelPlayer";

export default function BrandPage() {
  const { brand, updateBrand, log } = useStore();
  const set = <K extends keyof BrandKit>(k: K, v: BrandKit[K]) => updateBrand({ [k]: v } as Partial<BrandKit>);
  const previewScenes: Scene[] = useMemo(
    () => [
      { id: "t", kind: "title", duration: 2.5, overlay: "POV: you're a resident at our garden party 🌷", voiceover: "", motion: "still" },
      { id: "o", kind: "outro", duration: 3.5, overlay: brand.cta, voiceover: brand.cta, motion: "still" },
    ],
    [brand.cta],
  );

  const onLogo = (f?: File) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      set("logoDataUrl", r.result as string);
      log("Brand logo updated");
    };
    r.readAsDataURL(f);
  };

  return (
    <div>
      <PageHeader title="Brand kit" subtitle="Applied automatically to every reel, post and caption." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto]">
        <div className="space-y-5">
          <Section title="Identity">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Home name">
                <input className="input" value={brand.homeName} onChange={(e) => set("homeName", e.target.value)} />
              </Field>
              <Field label="Tagline">
                <input className="input" value={brand.tagline} onChange={(e) => set("tagline", e.target.value)} />
              </Field>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl border border-dashed border-line bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {brand.logoDataUrl ? <img src={brand.logoDataUrl} alt="Logo" className="max-h-full max-w-full object-contain" /> : <span className="text-xs text-muted">Logo</span>}
              </div>
              <label className="btn-ghost cursor-pointer">
                <Upload size={16} /> Upload logo
                <input type="file" accept="image/png,image/svg+xml,image/jpeg" hidden onChange={(e) => onLogo(e.target.files?.[0])} />
              </label>
              {brand.logoDataUrl && (
                <button onClick={() => set("logoDataUrl", undefined)} className="chip">
                  <X size={12} /> Remove
                </button>
              )}
            </div>
          </Section>

          <Section title="Look">
            <div className="grid grid-cols-3 gap-4">
              {(["primary", "accent", "secondary"] as const).map((k) => (
                <Field key={k} label={k}>
                  <label className="flex items-center gap-2 rounded-2xl border border-line bg-white p-2">
                    <input type="color" value={brand[k]} onChange={(e) => set(k, e.target.value)} className="h-9 w-9 cursor-pointer rounded-lg border-0 bg-transparent" />
                    <span className="font-mono text-xs uppercase">{brand[k]}</span>
                  </label>
                </Field>
              ))}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Heading font">
                <div className="flex gap-2">
                  {(["serif", "sans", "rounded"] as const).map((f) => (
                    <button key={f} onClick={() => set("headingFont", f)} className={cn("chip flex-1 justify-center py-2 capitalize", brand.headingFont === f && "chip-on")}>
                      {f}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Watermark">
                <label className="flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-sm">
                  <input type="checkbox" checked={brand.watermark} onChange={(e) => set("watermark", e.target.checked)} className="accent-[var(--brand)]" />
                  Show home name / logo on videos
                </label>
              </Field>
            </div>
          </Section>

          <Section title="Voice & sound">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Tone of voice">
                <select className="input" value={brand.tone} onChange={(e) => set("tone", e.target.value as BrandKit["tone"])}>
                  <option value="warm">Warm & caring</option>
                  <option value="upbeat">Upbeat & fun</option>
                  <option value="elegant">Elegant & refined</option>
                </select>
              </Field>
              <Field label="Default voiceover">
                <select className="input" value={brand.voiceId} onChange={(e) => set("voiceId", e.target.value)}>
                  {VOICES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Music mood">
                <select className="input" value={brand.musicMood} onChange={(e) => set("musicMood", e.target.value)}>
                  {MUSIC_MOODS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Call to action & contact">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Call to action">
                <input className="input" value={brand.cta} onChange={(e) => set("cta", e.target.value)} />
              </Field>
              <Field label="Phone">
                <input className="input" value={brand.phone} onChange={(e) => set("phone", e.target.value)} />
              </Field>
              <Field label="Booking link">
                <input className="input" value={brand.bookingUrl} onChange={(e) => set("bookingUrl", e.target.value)} />
              </Field>
              <Field label="CQC rating badge">
                <select className="input" value={brand.cqcRating ?? ""} onChange={(e) => set("cqcRating", e.target.value as BrandKit["cqcRating"])}>
                  <option value="">Don't show</option>
                  <option>Outstanding</option>
                  <option>Good</option>
                </select>
              </Field>
              <Field label="Default hashtags" className="sm:col-span-2">
                <input
                  className="input"
                  value={brand.hashtags.map((h) => `#${h}`).join(" ")}
                  onChange={(e) => set("hashtags", e.target.value.split(/\s+/).map((h) => h.replace(/^#/, "")).filter(Boolean))}
                />
              </Field>
            </div>
          </Section>
        </div>

        <div className="lg:sticky lg:top-8 lg:self-start">
          <div className="card p-5">
            <p className="label mb-3 text-center">Live preview</p>
            <ReelPlayer scenes={previewScenes} media={{}} brand={brand} style="cinematic" fileName="brand-preview" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="label capitalize">{label}</p>
      {children}
    </div>
  );
}
