import type { BlurBox, BrandKit, MediaAsset, Scene } from "../types";

/**
 * Canvas renderer — single source of truth for live preview AND export (MediaRecorder → WebM).
 * Production renders move to Remotion Lambda later using the same scene model.
 */

export type Aspect = "9:16" | "1:1" | "4:5";
export const ASPECT_SIZE: Record<Aspect, [number, number]> = { "9:16": [720, 1280], "1:1": [1080, 1080], "4:5": [1080, 1350] };

export interface RenderAssets {
  [mediaId: string]: { el: HTMLImageElement | HTMLVideoElement; asset: MediaAsset };
}

const FADE = 0.35;

export const fontFor = (f: BrandKit["headingFont"]) =>
  f === "serif" ? "Georgia, 'Times New Roman', serif" : f === "rounded" ? "'Trebuchet MS', 'Segoe UI', sans-serif" : "'Helvetica Neue', Arial, sans-serif";

export function timeline(scenes: Scene[]) {
  let t = 0;
  return scenes.map((s) => {
    const start = t;
    t += s.duration;
    return { scene: s, start, end: t };
  });
}

export const totalDuration = (scenes: Scene[]) => scenes.reduce((a, s) => a + s.duration, 0);

export function sceneAt(scenes: Scene[], t: number) {
  const tl = timeline(scenes);
  const i = tl.findIndex((x) => t < x.end);
  return { index: i === -1 ? tl.length - 1 : i, tl };
}

const ease = (x: number) => 0.5 - Math.cos(Math.PI * Math.min(1, Math.max(0, x))) / 2;

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function drawMedia(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  el: HTMLImageElement | HTMLVideoElement,
  asset: MediaAsset,
  motion: Scene["motion"],
  p: number,
) {
  const iw = el instanceof HTMLVideoElement ? el.videoWidth || asset.width : el.naturalWidth || asset.width;
  const ih = el instanceof HTMLVideoElement ? el.videoHeight || asset.height : el.naturalHeight || asset.height;
  if (!iw || !ih) return;
  const cover = Math.max(W / iw, H / ih);
  const e = ease(p);
  let zoom = 1.06;
  let dx = 0;
  if (motion === "zoom_in") zoom = 1.04 + 0.14 * e;
  if (motion === "zoom_out") zoom = 1.18 - 0.14 * e;
  if (motion === "pan_left" || motion === "pan_right") zoom = 1.16;
  const dw = iw * cover * zoom;
  const dh = ih * cover * zoom;
  const slack = dw - W;
  if (motion === "pan_left") dx = slack * (0.5 - e) * 0.9;
  if (motion === "pan_right") dx = slack * (e - 0.5) * 0.9;
  const x = (W - dw) / 2 + dx;
  const y = (H - dh) / 2;

  // Blurred backdrop fills letterbox areas for portrait output from landscape photos
  ctx.save();
  ctx.filter = "blur(28px) brightness(0.7)";
  const bc = Math.max(W / iw, H / ih) * 1.2;
  ctx.drawImage(el, (W - iw * bc) / 2, (H - ih * bc) / 2, iw * bc, ih * bc);
  ctx.restore();

  ctx.drawImage(el, x, y, dw, dh);
  drawBlurBoxes(ctx, el, asset.blurBoxes, x, y, dw, dh, iw, ih);
}

/** Consent blur: re-draws each box region heavily blurred (pixel-level privacy, not just an overlay). */
function drawBlurBoxes(
  ctx: CanvasRenderingContext2D,
  el: CanvasImageSource,
  boxes: BlurBox[],
  x: number,
  y: number,
  dw: number,
  dh: number,
  iw: number,
  ih: number,
) {
  for (const b of boxes) {
    const rx = x + b.x * dw;
    const ry = y + b.y * dh;
    const rw = b.w * dw;
    const rh = b.h * dh;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(rx, ry, rw, rh, Math.min(rw, rh) * 0.3);
    ctx.clip();
    // pixelate first (irreversible), then soften
    const s = 10;
    const tmp = document.createElement("canvas");
    tmp.width = s;
    tmp.height = Math.max(1, Math.round((s * rh) / rw));
    tmp.getContext("2d")!.drawImage(el, b.x * iw, b.y * ih, b.w * iw, b.h * ih, 0, 0, tmp.width, tmp.height);
    ctx.imageSmoothingEnabled = true;
    ctx.filter = "blur(6px)";
    ctx.drawImage(tmp, rx - 6, ry - 6, rw + 12, rh + 12);
    ctx.restore();
  }
}

function drawCard(ctx: CanvasRenderingContext2D, W: number, H: number, brand: BrandKit, scene: Scene, p: number, logo?: HTMLImageElement) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, brand.primary);
  g.addColorStop(1, shade(brand.primary, -35));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // soft bokeh
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = hexA(brand.accent, 0.08 + (i % 3) * 0.03);
    ctx.beginPath();
    ctx.arc(((i * 197) % W) + Math.sin(p * 2 + i) * 20, ((i * 331) % H) + p * 30, W * (0.12 + (i % 4) * 0.05), 0, Math.PI * 2);
    ctx.fill();
  }
  const font = fontFor(brand.headingFont);
  const e = ease(Math.min(1, p * 2.5));
  ctx.globalAlpha = e;
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  const size = Math.round(W * (scene.kind === "title" ? 0.075 : 0.062));
  ctx.font = `700 ${size}px ${font}`;
  const lines = wrap(ctx, scene.overlay, W * 0.8);
  const startY = H / 2 - (lines.length * size * 1.25) / 2 + (1 - e) * 30;
  lines.forEach((l, i) => ctx.fillText(l, W / 2, startY + i * size * 1.25 + size));
  if (logo) {
    const lh = W * 0.14;
    const lw = (logo.naturalWidth / logo.naturalHeight) * lh;
    ctx.drawImage(logo, (W - lw) / 2, startY - lh - size * 0.8, lw, lh);
  }
  if (scene.kind === "outro") {
    ctx.font = `500 ${Math.round(W * 0.038)}px ${font}`;
    ctx.fillStyle = hexA("#ffffff", 0.9);
    const by = startY + lines.length * size * 1.25 + size * 1.6;
    ctx.fillText(brand.homeName, W / 2, by);
    ctx.font = `600 ${Math.round(W * 0.042)}px ${font}`;
    ctx.fillStyle = brand.accent;
    ctx.fillText(`☎ ${brand.phone}`, W / 2, by + W * 0.07);
    if (brand.cqcRating) {
      ctx.font = `600 ${Math.round(W * 0.03)}px ${font}`;
      const label = `CQC rated ${brand.cqcRating}`;
      const tw = ctx.measureText(label).width + 40;
      ctx.fillStyle = hexA("#ffffff", 0.15);
      ctx.beginPath();
      ctx.roundRect((W - tw) / 2, by + W * 0.11, tw, W * 0.06, W * 0.03);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillText(label, W / 2, by + W * 0.11 + W * 0.04);
    }
  }
  ctx.globalAlpha = 1;
}

function drawOverlayText(ctx: CanvasRenderingContext2D, W: number, H: number, brand: BrandKit, text: string, p: number, style: string) {
  if (!text) return;
  const font = fontFor(brand.headingFont);
  const size = Math.round(W * (style === "upbeat" ? 0.068 : 0.056));
  ctx.font = `800 ${size}px ${font}`;
  ctx.textAlign = "center";
  const lines = wrap(ctx, style === "upbeat" ? text.toUpperCase() : text, W * 0.82);
  const e = ease(Math.min(1, p * 4));
  const y0 = H * 0.2;
  lines.forEach((l, i) => {
    const y = y0 + i * size * 1.2 + (1 - e) * 20;
    const tw = ctx.measureText(l).width;
    ctx.globalAlpha = e;
    if (style === "upbeat") {
      ctx.fillStyle = brand.accent;
      ctx.beginPath();
      ctx.roundRect(W / 2 - tw / 2 - 16, y - size * 0.95, tw + 32, size * 1.25, 12);
      ctx.fill();
      ctx.fillStyle = "#fff";
    } else {
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "#fff";
    }
    ctx.fillText(l, W / 2, y);
    ctx.shadowBlur = 0;
  });
  ctx.globalAlpha = 1;
}

function drawCaption(ctx: CanvasRenderingContext2D, W: number, H: number, text: string) {
  if (!text) return;
  const size = Math.round(W * 0.04);
  ctx.font = `600 ${size}px 'Helvetica Neue', Arial, sans-serif`;
  ctx.textAlign = "center";
  const lines = wrap(ctx, text, W * 0.8).slice(0, 3);
  const pad = size * 0.5;
  const boxH = lines.length * size * 1.3 + pad * 2;
  const y = H * 0.78 - boxH / 2;
  const maxW = Math.max(...lines.map((l) => ctx.measureText(l).width));
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.beginPath();
  ctx.roundRect(W / 2 - maxW / 2 - pad * 1.5, y, maxW + pad * 3, boxH, size * 0.5);
  ctx.fill();
  ctx.fillStyle = "#fff";
  lines.forEach((l, i) => ctx.fillText(l, W / 2, y + pad + size + i * size * 1.3 - size * 0.15));
}

function drawWatermark(ctx: CanvasRenderingContext2D, W: number, brand: BrandKit, logo?: HTMLImageElement) {
  const size = Math.round(W * 0.03);
  ctx.globalAlpha = 0.85;
  if (logo) {
    const h = W * 0.07;
    ctx.drawImage(logo, W * 0.05, W * 0.05, (logo.naturalWidth / logo.naturalHeight) * h, h);
  } else {
    ctx.font = `600 ${size}px ${fontFor(brand.headingFont)}`;
    ctx.textAlign = "left";
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 8;
    ctx.fillText(brand.homeName, W * 0.05, W * 0.08);
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;
}

export interface DrawOpts {
  brand: BrandKit;
  style: string;
  captions: boolean;
  logo?: HTMLImageElement;
}

function drawScene(ctx: CanvasRenderingContext2D, W: number, H: number, scene: Scene, p: number, assets: RenderAssets, o: DrawOpts) {
  if (scene.kind !== "media") return drawCard(ctx, W, H, o.brand, scene, p, o.logo);
  const a = scene.mediaId ? assets[scene.mediaId] : undefined;
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, W, H);
  if (a) drawMedia(ctx, W, H, a.el, a.asset, scene.motion, p);
  if (o.style === "cinematic") {
    // film grade vignette
    const v = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, H * 0.75);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }
  drawOverlayText(ctx, W, H, o.brand, scene.overlay, p, o.style);
  if (o.captions) drawCaption(ctx, W, H, scene.voiceover);
  if (o.brand.watermark) drawWatermark(ctx, W, o.brand, o.logo);
}

export function drawFrame(ctx: CanvasRenderingContext2D, scenes: Scene[], t: number, assets: RenderAssets, o: DrawOpts) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  if (!scenes.length) return;
  const { index, tl } = sceneAt(scenes, t);
  const cur = tl[index];
  const p = (t - cur.start) / cur.scene.duration;
  drawScene(ctx, W, H, cur.scene, p, assets, o);
  // crossfade into next scene
  const next = tl[index + 1];
  if (next && cur.end - t < FADE) {
    ctx.globalAlpha = 1 - (cur.end - t) / FADE;
    drawScene(ctx, W, H, next.scene, 0, assets, o);
    ctx.globalAlpha = 1;
  }
}

// colour helpers
function shade(hex: string, amt: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  const c = (v: number) => Math.max(0, Math.min(255, v + amt));
  return `rgb(${c(n >> 16)}, ${c((n >> 8) & 255)}, ${c(n & 255)})`;
}
function hexA(hex: string, a: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
