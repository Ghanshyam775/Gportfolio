import type { Channel, ConsentDecision, MediaAsset, Resident } from "./types";

export function hasValidConsent(r: Resident | undefined, channel: Channel = "social", now = new Date()): boolean {
  if (!r || r.withdrawnAt) return false;
  if (r.expiresAt && new Date(r.expiresAt) < now) return false;
  return r.consents.some((c) => c.channel === channel && c.granted);
}

export function consentExpiringSoon(r: Resident, days = 30, now = new Date()): boolean {
  if (!r.expiresAt || r.withdrawnAt) return false;
  const diff = (new Date(r.expiresAt).getTime() - now.getTime()) / 86_400_000;
  return diff >= 0 && diff <= days;
}

/**
 * Consent Guard decision for one asset (safe by default):
 * - dignity flag without manager override → excluded
 * - unknown people or non-consented residents → needs_blur until blur boxes are drawn
 *   (blur boxes are assumed to cover every non-consented face; the user confirms this in the grid)
 * - videos cannot be region-blurred in the MVP → excluded
 */
export function decide(asset: MediaAsset, residents: Resident[]): ConsentDecision {
  if (asset.flags.length > 0 && !asset.overrideReason) return "excluded";
  const nonConsented = asset.residentIds.filter(
    (id) => !hasValidConsent(residents.find((r) => r.id === id)),
  );
  const needsHiding = asset.unknownPeople || nonConsented.length > 0;
  if (!needsHiding) return "ok";
  if (asset.kind === "video") return "excluded";
  return asset.blurBoxes.length > 0 ? "ok" : "needs_blur";
}

export function decisionLabel(d: ConsentDecision): string {
  return d === "ok" ? "Cleared" : d === "needs_blur" ? "Blur needed" : "Excluded";
}
