"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Pause, Play, RotateCcw, Volume2, VolumeX, Loader2 } from "lucide-react";
import type { BrandKit, MediaAsset, Scene } from "@/lib/types";
import { getMediaUrl } from "@/lib/media";
import { ASPECT_SIZE, type Aspect, type RenderAssets, drawFrame, sceneAt, timeline, totalDuration } from "@/lib/render/renderer";
import { cn } from "@/lib/utils";

interface Props {
  scenes: Scene[];
  media: Record<string, MediaAsset>;
  brand: BrandKit;
  style: string;
  aspect?: Aspect;
  fileName?: string;
  onExported?: () => void;
}

const VOICE_HINT: Record<string, { pitch: number; rate: number; female: boolean }> = {
  "en-GB-warm-female": { pitch: 1.05, rate: 0.98, female: true },
  "en-GB-warm-male": { pitch: 0.95, rate: 0.98, female: false },
  "en-GB-bright-female": { pitch: 1.2, rate: 1.06, female: true },
  "en-GB-calm-male": { pitch: 0.85, rate: 0.92, female: false },
};

export function ReelPlayer({ scenes, media, brand, style, aspect = "9:16", fileName = "reel", onExported }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const assetsRef = useRef<RenderAssets>({});
  const logoRef = useRef<HTMLImageElement | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [voice, setVoice] = useState(false);
  const [captions, setCaptions] = useState(true);
  const [exporting, setExporting] = useState<number | null>(null);
  const tRef = useRef(0);
  const lastScene = useRef(-1);
  const raf = useRef(0);
  const dur = totalDuration(scenes);
  const [W, H] = ASPECT_SIZE[aspect];

  // load assets
  useEffect(() => {
    let alive = true;
    setReady(false);
    const ids = Array.from(new Set(scenes.map((s) => s.mediaId).filter(Boolean))) as string[];
    Promise.all(
      ids.map(async (id) => {
        const asset = media[id];
        const url = await getMediaUrl(id);
        if (!asset || !url) return;
        if (asset.kind === "video") {
          const v = document.createElement("video");
          v.src = url;
          v.muted = true;
          v.playsInline = true;
          v.preload = "auto";
          await new Promise((r) => {
            v.onloadeddata = r;
            v.onerror = r;
          });
          assetsRef.current[id] = { el: v, asset };
        } else {
          const img = new Image();
          img.src = url;
          await img.decode().catch(() => {});
          assetsRef.current[id] = { el: img, asset };
        }
      }),
    ).then(async () => {
      if (brand.logoDataUrl) {
        const l = new Image();
        l.src = brand.logoDataUrl;
        await l.decode().catch(() => {});
        logoRef.current = l;
      } else logoRef.current = undefined;
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [scenes, media, brand.logoDataUrl]);

  const draw = useCallback(
    (time: number) => {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      drawFrame(ctx, scenes, time, assetsRef.current, { brand, style, captions, logo: logoRef.current });
    },
    [scenes, brand, style, captions],
  );

  useEffect(() => {
    if (ready) draw(tRef.current || Math.min(1.2, dur / 2));
  }, [ready, draw, dur]);

  const speak = useCallback(
    (text: string) => {
      if (!voice || typeof speechSynthesis === "undefined") return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const hint = VOICE_HINT[brand.voiceId] ?? VOICE_HINT["en-GB-warm-female"];
      const gb = speechSynthesis.getVoices().filter((v) => v.lang === "en-GB");
      u.voice = gb.find((v) => /female|libby|sonia|serena|kate/i.test(v.name) === hint.female) ?? gb[0] ?? null;
      u.lang = "en-GB";
      u.pitch = hint.pitch;
      u.rate = hint.rate;
      speechSynthesis.speak(u);
    },
    [voice, brand.voiceId],
  );

  const onSceneChange = useCallback(
    (time: number) => {
      const { index, tl } = sceneAt(scenes, time);
      if (index === lastScene.current) return;
      lastScene.current = index;
      const s = tl[index].scene;
      Object.values(assetsRef.current).forEach((a) => a.el instanceof HTMLVideoElement && a.el.pause());
      const a = s.mediaId ? assetsRef.current[s.mediaId] : undefined;
      if (a?.el instanceof HTMLVideoElement) {
        a.el.currentTime = Math.max(0, time - tl[index].start);
        void a.el.play().catch(() => {});
      }
      speak(s.voiceover);
    },
    [scenes, speak],
  );

  const loop = useCallback(
    (stopAtEnd: () => void) => {
      let prev = performance.now();
      const tick = (now: number) => {
        const nt = tRef.current + (now - prev) / 1000;
        prev = now;
        if (nt >= dur) {
          tRef.current = dur - 0.001;
          setT(tRef.current);
          draw(tRef.current);
          stopAtEnd();
          return;
        }
        tRef.current = nt;
        onSceneChange(nt);
        draw(nt);
        setT(nt);
        raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
    },
    [dur, draw, onSceneChange],
  );

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    setPlaying(false);
    Object.values(assetsRef.current).forEach((a) => a.el instanceof HTMLVideoElement && a.el.pause());
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  }, []);

  useEffect(() => stop, [stop]);

  const play = () => {
    if (tRef.current >= dur - 0.05) tRef.current = 0;
    lastScene.current = -1;
    setPlaying(true);
    loop(stop);
  };

  const seek = (v: number) => {
    stop();
    tRef.current = v;
    lastScene.current = -1;
    setT(v);
    draw(v);
  };

  const exportVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas || typeof MediaRecorder === "undefined") return alert("Video export needs a modern browser (Chrome, Edge, Firefox).");
    stop();
    const stream = canvas.captureStream(30);
    const mime = ["video/mp4;codecs=avc1", "video/webm;codecs=vp9", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "video/webm";
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const done = new Promise<void>((r) => (rec.onstop = () => r()));
    tRef.current = 0;
    lastScene.current = -1;
    setExporting(0);
    rec.start(250);
    const prevVoice = voice;
    setVoice(false);
    await new Promise<void>((resolve) => {
      let prev = performance.now();
      const tick = (now: number) => {
        const nt = tRef.current + (now - prev) / 1000;
        prev = now;
        if (nt >= dur) return resolve();
        tRef.current = nt;
        onSceneChange(nt);
        draw(nt);
        setT(nt);
        setExporting(nt / dur);
        raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
    });
    rec.stop();
    await done;
    setVoice(prevVoice);
    setExporting(null);
    const blob = new Blob(chunks, { type: mime.split(";")[0] });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${fileName}.${mime.includes("mp4") ? "mp4" : "webm"}`;
    a.click();
    onExported?.();
  };

  const tl = timeline(scenes);
  const { index } = sceneAt(scenes, t);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative overflow-hidden rounded-[28px] bg-black shadow-2xl ring-1 ring-black/10"
        style={{ width: aspect === "9:16" ? 300 : 340, aspectRatio: `${W} / ${H}` }}
      >
        <canvas ref={canvasRef} width={W} height={H} className="h-full w-full" />
        {!ready && (
          <div className="absolute inset-0 grid place-items-center text-white/80">
            <Loader2 className="animate-spin" />
          </div>
        )}
        {exporting !== null && (
          <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-center text-xs text-white">
            Rendering… {Math.round(exporting * 100)}%
          </div>
        )}
      </div>
      <div className="flex w-full max-w-[340px] items-center gap-2">
        <button
          onClick={playing ? stop : play}
          disabled={!ready || exporting !== null}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--ink)] text-white disabled:opacity-40"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>
        <input
          type="range"
          min={0}
          max={dur}
          step={0.01}
          value={t}
          onChange={(e) => seek(+e.target.value)}
          className="w-full accent-[var(--brand)]"
          aria-label="Seek"
        />
        <span className="w-14 shrink-0 text-right text-xs tabular-nums text-[var(--muted)]">
          {t.toFixed(1)}/{dur.toFixed(0)}s
        </span>
      </div>
      <div className="flex w-full max-w-[340px] gap-1">
        {tl.map((x, i) => (
          <button
            key={x.scene.id}
            onClick={() => seek(x.start + 0.01)}
            className={cn("h-1.5 rounded-full transition", i === index ? "bg-[var(--brand)]" : "bg-black/10 hover:bg-black/20")}
            style={{ flexGrow: x.scene.duration }}
            aria-label={`Scene ${i + 1}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2 text-xs">
        <button onClick={() => setVoice((v) => !v)} className="chip">
          {voice ? <Volume2 size={14} /> : <VolumeX size={14} />} Voice preview
        </button>
        <button onClick={() => setCaptions((c) => !c)} className={cn("chip", captions && "chip-on")}>
          CC Captions
        </button>
        <button onClick={() => seek(0)} className="chip">
          <RotateCcw size={14} /> Restart
        </button>
        <button onClick={exportVideo} disabled={!ready || exporting !== null} className="chip chip-on">
          <Download size={14} /> Export video
        </button>
      </div>
    </div>
  );
}
