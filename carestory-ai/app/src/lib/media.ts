"use client";

import { get, set, del } from "idb-keyval";
import { useEffect, useState } from "react";
import type { MediaAsset } from "./types";
import { uid } from "./utils";

/** Media blobs live in IndexedDB (prototype). Swap for S3 multipart upload + signed URLs later. */

const urlCache = new Map<string, string>();

export async function getMediaUrl(id: string): Promise<string | null> {
  if (urlCache.has(id)) return urlCache.get(id)!;
  const blob = await get<Blob>(`media:${id}`);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urlCache.set(id, url);
  return url;
}

export function useMediaUrl(id?: string) {
  const [url, setUrl] = useState<string | null>(id ? urlCache.get(id) ?? null : null);
  useEffect(() => {
    let alive = true;
    if (id) getMediaUrl(id).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [id]);
  return url;
}

export async function deleteMedia(id: string) {
  await del(`media:${id}`);
  const u = urlCache.get(id);
  if (u) URL.revokeObjectURL(u);
  urlCache.delete(id);
}

function brightnessOf(src: CanvasImageSource, w: number, h: number): number {
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(src, 0, 0, w, h, 0, 0, 32, 32);
  const d = ctx.getImageData(0, 0, 32, 32).data;
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
  return sum / (d.length / 4) / 255;
}

/** Downscale big photos (phones produce 12MP+) to max 2048px to keep the prototype light. */
async function normaliseImage(file: File): Promise<{ blob: Blob; w: number; h: number; brightness: number }> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 2048 / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  c.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  const brightness = brightnessOf(c, w, h);
  const blob: Blob = await new Promise((res) => c.toBlob((b) => res(b ?? file), "image/jpeg", 0.88));
  bmp.close();
  return { blob, w, h, brightness };
}

async function probeVideo(file: File): Promise<{ w: number; h: number; duration: number; brightness: number }> {
  const url = URL.createObjectURL(file);
  const v = document.createElement("video");
  v.muted = true;
  v.preload = "auto";
  v.src = url;
  await new Promise<void>((res, rej) => {
    v.onloadeddata = () => res();
    v.onerror = () => rej(new Error("Unsupported video"));
  });
  v.currentTime = Math.min(1, v.duration / 2);
  await new Promise((r) => (v.onseeked = r));
  const out = { w: v.videoWidth, h: v.videoHeight, duration: v.duration, brightness: brightnessOf(v, v.videoWidth, v.videoHeight) };
  URL.revokeObjectURL(url);
  return out;
}

export async function ingestFile(file: File): Promise<MediaAsset> {
  const id = uid("m");
  const isVideo = file.type.startsWith("video/");
  const base = { id, name: file.name, residentIds: [], unknownPeople: false, blurBoxes: [], flags: [], starred: false };
  if (isVideo) {
    const p = await probeVideo(file);
    await set(`media:${id}`, file);
    return { ...base, kind: "video", width: p.w, height: p.h, duration: p.duration, brightness: p.brightness };
  }
  const n = await normaliseImage(file);
  await set(`media:${id}`, n.blob);
  return { ...base, kind: "image", width: n.w, height: n.h, brightness: n.brightness };
}

/** Generates a soft placeholder image so the demo works without real uploads. */
export async function createDemoAsset(label: string, hue: number): Promise<MediaAsset> {
  const c = document.createElement("canvas");
  c.width = 1280;
  c.height = 960;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 1280, 960);
  g.addColorStop(0, `hsl(${hue} 55% 55%)`);
  g.addColorStop(1, `hsl(${(hue + 40) % 360} 60% 30%)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1280, 960);
  for (let i = 0; i < 18; i++) {
    ctx.fillStyle = `hsla(${(hue + i * 20) % 360} 80% 80% / 0.18)`;
    ctx.beginPath();
    ctx.arc(Math.random() * 1280, Math.random() * 960, 40 + Math.random() * 160, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "600 64px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText(label, 640, 500);
  const blob: Blob = await new Promise((res) => c.toBlob((b) => res(b!), "image/jpeg", 0.9));
  const id = uid("m");
  await set(`media:${id}`, blob);
  return { id, kind: "image", name: `${label}.jpg`, width: 1280, height: 960, brightness: 0.5, residentIds: [], unknownPeople: false, blurBoxes: [], flags: [], starred: false };
}
