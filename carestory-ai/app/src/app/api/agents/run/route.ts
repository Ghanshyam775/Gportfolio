import { runPipeline } from "@/lib/agents/pipeline";
import type { AgentMessage, PipelineInput } from "@/lib/types";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  brief: z.object({
    type: z.string(),
    title: z.string().min(1).max(120),
    date: z.string(),
    description: z.string().max(2000),
    highlights: z.array(z.string().max(200)).max(10),
    visitors: z.string().max(200).optional(),
  }),
  format: z.enum(["reel", "carousel", "single", "story"]),
  length: z.union([z.literal(15), z.literal(30), z.literal(45), z.literal(60)]),
  style: z.enum(["cinematic", "documentary", "upbeat", "elegant"]),
  platforms: z.array(z.enum(["instagram", "facebook", "tiktok", "youtube", "linkedin", "google"])).min(1),
  brand: z.record(z.string(), z.unknown()),
  media: z
    .array(
      z.object({
        id: z.string(),
        kind: z.enum(["image", "video"]),
        duration: z.number().optional(),
        brightness: z.number(),
        starred: z.boolean(),
        residentIds: z.array(z.string()),
        residentNames: z.array(z.string()),
        decision: z.enum(["ok", "needs_blur", "excluded"]),
      }),
    )
    .max(500),
});

/** Streams agent progress as NDJSON. */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data as unknown as PipelineInput;

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (m: AgentMessage) => controller.enqueue(enc.encode(JSON.stringify(m) + "\n"));
      try {
        await runPipeline(input, emit);
      } catch (e) {
        if ((e as Error).message !== "no usable media") emit({ type: "error", message: "Generation failed. Please try again." });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" } });
}
