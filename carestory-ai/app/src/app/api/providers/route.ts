import { providerStatus } from "@/lib/ai/providers";

export function GET() {
  return Response.json(providerStatus());
}
