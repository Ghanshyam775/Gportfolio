"use client";

import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import type { BrandKit, MediaAsset, Scene } from "@/lib/types";
import { getMediaUrl } from "@/lib/media";
import { ASPECT_SIZE, drawFrame, type RenderAssets } from "@/lib/render/renderer";

/** Carousel / single-image posts: each scene renders as a 4:5 branded still. */
export function Slides({ scenes, media, brand, style, fileName }: { scenes: Scene[]; media: Record<string, MediaAsset>; brand: BrandKit; style: string; fileName: string }) {
  const refs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [ready, setReady] = useState(false);
  const [W, H] = ASPECT_SIZE["4:5"];

  useEffect(() => {
    let alive = true;
    (async () => {
      const assets: RenderAssets = {};
      for (const s of scenes) {
        if (!s.mediaId || assets[s.mediaId]) continue;
        const a = media[s.mediaId];
        const url = await getMediaUrl(s.mediaId);
        if (!a || !url) continue;
        if (a.kind === "video") {
          const v = document.createElement("video");
          v.src = url;
          v.muted = true;
          await new Promise((r) => (v.onloadeddata = r));
          v.currentTime = Math.min(1, (a.duration ?? 2) / 2);
          await new Promise((r) => (v.onseeked = r));
          assets[s.mediaId] = { el: v, asset: a };
        } else {
          const img = new Image();
          img.src = url;
          await img.decode().catch(() => {});
          assets[s.mediaId] = { el: img, asset: a };
        }
      }
      let logo: HTMLImageElement | undefined;
      if (brand.logoDataUrl) {
        logo = new Image();
        logo.src = brand.logoDataUrl;
        await logo.decode().catch(() => {});
      }
      if (!alive) return;
      scenes.forEach((s, i) => {
        const ctx = refs.current[i]?.getContext("2d");
        if (ctx) drawFrame(ctx, [{ ...s, voiceover: "", motion: "still" }], 0.99 * s.duration || 0.99, assets, { brand, style, captions: false, logo });
      });
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [scenes, media, brand, style]);

  const download = (i: number) => {
    const c = refs.current[i];
    if (!c) return;
    const a = document.createElement("a");
    a.href = c.toDataURL("image/jpeg", 0.92);
    a.download = `${fileName}-${i + 1}.jpg`;
    a.click();
  };

  return (
    <div className="w-full">
      <div className="flex snap-x gap-3 overflow-x-auto pb-3">
        {scenes.map((s, i) => (
          <div key={s.id} className="relative shrink-0 snap-center">
            <canvas ref={(el) => void (refs.current[i] = el)} width={W} height={H} className="w-56 rounded-2xl shadow-lg ring-1 ring-black/10" style={{ aspectRatio: `${W}/${H}` }} />
            <button onClick={() => download(i)} disabled={!ready} className="chip absolute right-2 bottom-2 bg-white/90">
              <Download size={12} /> {i + 1}
            </button>
          </div>
        ))}
      </div>
      <button onClick={() => scenes.forEach((_, i) => setTimeout(() => download(i), i * 300))} disabled={!ready} className="btn-ghost mt-2">
        <Download size={16} /> Download all ({scenes.length})
      </button>
    </div>
  );
}
