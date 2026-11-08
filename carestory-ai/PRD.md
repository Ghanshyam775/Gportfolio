# PRD — CareStory AI (working name)

**AI content studio that turns everyday care-home life into consent-safe, scroll-stopping social media.**

| | |
|---|---|
| Status | Draft v0.1 — for review |
| Date | 8 Nov 2026 |
| Market | United Kingdom (England first; Scotland/Wales/NI follow) |
| Owner | Founder / Product |
| Doc type | Product Requirements Document (MVP + roadmap) |

---

## 1. Problem Statement

UK care homes run activities every week — Halloween parties, birthday teas, garden days, music therapy, pet visits, Remembrance services. These moments are the single most persuasive proof of quality for families choosing a home, yet almost none of it becomes good social content. Activity coordinators and home managers have **no time, no editing skills, and real fear of getting resident consent wrong**, so posts are rare, low-quality (blurry photo + "Fun day today!"), or not made at all.

The result: weak social presence, fewer enquiries and tours, and heavier reliance on paid directories and agencies. With occupancy directly tied to revenue, every empty bed costs a home roughly £1,000+ per week (assumption — validate per region), so even one extra admission per quarter justifies the product.

**Who feels it:** activity coordinators (create), home managers (approve, worried about CQC & GDPR), group marketing leads (consistency across many homes), and families (want to see their relative is happy).

---

## 2. Goals

**User goals**
1. **Raw media → publish-ready reel in under 10 minutes of human time** (upload + review + approve), vs. hours or never today.
2. **Zero consent incidents** — no resident appears in published content without a valid, recorded consent for that channel.
3. **Consistent presence** — homes post at least 3× per week without extra staff.

**Business goals**
4. **Measurable lead uplift** — customers see ≥25% more social-attributed enquiries (tour bookings, calls, DMs) within 90 days.
5. **Healthy SaaS economics** — ≥80% gross margin per seat, logo churn <3%/month, and group (multi-home) accounts ≥40% of revenue by month 12.

---

## 3. Non-Goals (v1)

| Non-goal | Why |
|---|---|
| Full care-management / care-plan software | Crowded market (Person Centred Software, Nourish, etc.); we integrate, not compete. |
| Generating fake "residents" or fabricating events that didn't happen | Dignity, trust and advertising-honesty risk (CQC Reg. 10, ASA CAP Code). Generative AI is used only to *enhance* real media, add B-roll, titles and transitions. |
| Paid ads management | Separate skill set & liability; P2 once organic is proven. |
| Live-streaming | Highest consent risk, low ROI for v1. |
| A general-purpose video editor for any industry | Focus beats breadth; our moat is care-specific consent + storytelling. |

---

## 4. Personas

| Persona | Context | Primary need |
|---|---|---|
| **Aisha — Activity Coordinator** | Phone-first, takes 100+ photos per event, not technical | "Let me dump my photos and get something I'm proud of." |
| **Mark — Home Manager / Registered Manager** | Accountable to CQC & owners, time-poor | "Nothing goes out that could get us in trouble. Show me enquiries." |
| **Priya — Group Marketing Lead (10–80 homes)** | Brand consistency, reporting to ops director | "Every home on-brand, one dashboard, approvals by exception." |
| **Family member** (secondary) | Wants reassurance | "Show me Mum enjoying herself; let me say yes/no to her being featured." |

---

## 5. Core Concept — The Agent Flow

The user experience is **event-first**: *"Tell us what happened, drop your media, we'll do the rest."* Behind the scenes a pipeline of specialised agents runs as a durable workflow; the user sees a live, friendly progress view and steps in only at two checkpoints (Consent and Storyboard).

```
 Upload + Event details
        │
 ① Ingest Agent ──── dedupe, quality score, scene/shot detection, transcribe audio
        │
 ② Consent Guard ─── detect people → match to consent register → blur/exclude/flag
        │            dignity screen (distress, undress, medical equipment, private rooms)
        │   ◀── CHECKPOINT 1: user confirms people & exclusions
        │
 ③ Research Agent ── UK awareness days, seasonal hooks, current reel formats/trends,
        │            local area, home's past top performers
 ④ Story Agent ───── hook → narrative arc → script, on-screen text, captions,
        │            hashtags, CTA; in the home's brand voice; per-platform variants
 ⑤ Director Agent ── shot list & timeline (best clips, pacing to beat), music mood,
        │            transitions, where to use AI motion/B-roll
        │   ◀── CHECKPOINT 2: Storyboard review (edit any line/scene, swap voice/music)
        │
 ⑥ Production ────── voiceover (TTS), music, enhancement (upscale, stabilise, colour),
        │            subtle image-to-video motion on photos, branded titles, captions
        │            render vertical 9:16 + 1:1 + 4:5
 ⑦ QA Agent ──────── brand-kit compliance, caption accuracy, safe-zones, consent re-check
        │
 Approve → Schedule → Publish (IG, FB, TikTok, YouTube Shorts, LinkedIn, Google Business)
        │
 ⑧ Insights Agent ── performance + lead attribution feeds back into Research & Story
```

**Example (Halloween):** Aisha uploads 64 photos + 9 clips and types *"Halloween party in the lounge, pumpkin carving, Joan (94) won best costume as a witch, kids from St Mary's school visited."* The system excludes 3 residents without social consent (auto-blur in 2 group shots, drops 1 clip), picks a "costume reveal" hook trend, writes a 30-second warm-and-funny script ending with "Come and see life at Oakwood — book a visit", generates a British voiceover, cuts to music, adds subtle cinematic motion to the best stills, and delivers a reel + 6-image carousel + Facebook post + Google Business update — all awaiting Mark's one-tap approval.

---

## 6. User Stories (priority order)

**Activity Coordinator**
- As a coordinator, I want to upload all photos/videos from an event from my phone in one go, so that I don't have to choose or edit them myself.
- As a coordinator, I want to describe the event in a few words (or a voice note), so that the story reflects what really happened.
- As a coordinator, I want to pick "Reel 15s / 30s / 60s", "Carousel", "Single post" or "Story", so that I get the right format for each platform.
- As a coordinator, I want to see a storyboard and change any line or scene before rendering, so that I stay in control.
- As a coordinator, I want to plan upcoming events and get a teaser post beforehand, so that we build anticipation.
- *Edge:* As a coordinator, if my upload is too dark/blurry/short, I want clear advice and a best-effort result rather than a failure.

**Home Manager**
- As a manager, I want nothing published without my approval (configurable), so that I remain accountable.
- As a manager, I want the system to block residents without consent automatically, so that I'm protected even when staff make mistakes.
- As a manager, I want an audit trail of who appeared, under which consent, and who approved, so that I can answer a CQC inspector or a family complaint.
- As a manager, I want to take down every post featuring a resident in one click if consent is withdrawn.

**Group Marketing Lead**
- As a group lead, I want one brand kit with per-home overrides, so that 40 homes look consistent but local.
- As a group lead, I want a dashboard of posts, engagement and enquiries per home, so that I can prove ROI.

**Family / Resident**
- As a family member with LPA, I want to give, change or withdraw media consent from a secure link, so that I'm in control of my relative's image.

---

## 7. Requirements

### P0 — Must-have (MVP)

| # | Requirement | Acceptance criteria |
|---|---|---|
| P0-1 | **Event workspace & bulk upload** (web + mobile PWA) | Upload ≥200 files / 5 GB per event, resumable; HEIC, JPG, PNG, MP4, MOV; works on 4G; background upload continues if screen locks. |
| P0-2 | **Event brief** | Free text + quick chips (event type, highlights, named residents, visitors) + optional voice note transcribed. Event templates (Halloween, Christmas, Birthday, Garden Party, Remembrance, Pet Therapy…). |
| P0-3 | **Resident consent register** | Per resident: consent status per channel (internal, website, social, paid ads), given by (resident / LPA / best-interests record), date, expiry, evidence file. Withdrawal is immediate and propagates. |
| P0-4 | **Consent Guard** | Given media with people, when a person is not matched to a resident with valid *social* consent, then they are blurred or the asset is excluded by default. Unknown faces default to **blur**. User must confirm the people grid before generation. Every published asset stores a consent snapshot. |
| P0-5 | **Dignity screen** | Flags images showing distress, partial undress, personal care, medical devices, bedrooms/bathrooms, visible documents/names; flagged assets excluded unless manager overrides with a reason (logged). |
| P0-6 | **Brand kit** | Logo(s), colour palette, fonts, intro/outro sting, lower-thirds style, watermark, tone of voice (warm / upbeat / elegant), default voice, music mood, standard CTA (phone, booking link), hashtags, CQC rating badge (optional). Applied to every output. |
| P0-7 | **Format & style picker** | Reel 9:16 at **15 / 30 / 45 / 60 s**; carousel (up to 10); single image post; story; style presets: *Cinematic*, *Warm documentary*, *Upbeat & trendy*, *Elegant*. |
| P0-8 | **Story Agent output** | For each format: hook (first 2 s), script, on-screen text, caption (platform-length aware), hashtags, CTA, alt text. British English. No medical claims. Regenerate per section. |
| P0-9 | **Storyboard checkpoint** | Visual scene list with chosen media, VO line, text overlay; drag to reorder, swap media, edit text, change voice/music, then render. |
| P0-10 | **Production** | Voiceover (British voices), licensed music, auto-captions burned-in + SRT, enhancement (upscale, denoise, stabilise, colour match), subtle AI motion on stills, branded titles; render 1080×1920 (+1:1, 4:5). Typical render < 5 min. |
| P0-11 | **Approval workflow** | Roles: Coordinator, Manager, Group Admin. Configurable "manager approval required". Approve / request changes with comment. |
| P0-12 | **Scheduling & publishing** | Connect Instagram, Facebook Page, TikTok, YouTube Shorts, LinkedIn, Google Business Profile. Schedule, best-time suggestion, and download as fallback. |
| P0-13 | **Content calendar** | Month view of upcoming events, scheduled posts, UK awareness days (e.g. Dementia Action Week, Care Home Open Day, Carers Week, Remembrance). |
| P0-14 | **Audit log & takedown** | Immutable log of uploads, consent checks, overrides, approvals, publishes. One-click "remove all content featuring resident X" across connected platforms + internal library. |
| P0-15 | **Billing** | Stripe, GBP, VAT invoices, monthly/annual, per-home plans, usage credits for video minutes. |

### P1 — Nice-to-have (fast follow, months 4–6)

- **Family consent portal** — secure magic-link, e-signature, LPA upload, reminders on expiry, notification when relative features (opt-in).
- **Face matching (opt-in)** — biometric matching to the consent register to speed up tagging (requires DPIA and explicit consent; see §10).
- **WhatsApp / email drop-in** — send media to a home-specific number/address to start an event.
- **Upcoming-event teasers** — auto-generate "Coming this Friday…" posts from the calendar.
- **Insights & lead attribution** — per-post UTM links, "Book a visit" landing page per home, enquiry tracking, monthly PDF report for owners.
- **Group mode** — multi-home dashboard, brand-kit inheritance, bulk approvals, cross-home "best of the month" compilations.
- **Testimonial studio** — guided family/staff testimonial recording with teleprompter & consent built in.
- **Recruitment content** — "day in the life" staff reels (big pain point: care staffing).

### P2 — Future (design for, don't build)

- Paid social boosts with spend caps; Meta/TikTok ads.
- Integrations with care-management systems (activity logs, resident lists) to auto-create events and sync consent.
- Multilingual voiceover/captions (Welsh, Polish, Punjabi, Urdu…).
- Newsletter/website blog auto-generation from the same events.
- Home-care / supported living / retirement villages; Ireland, Australia, NZ.
- Avatar "virtual host" for the home (manager's cloned voice/likeness, with their consent).

---

## 8. UX & UI Principles

1. **Event-first, not editor-first.** Home screen = "What happened today?" button + calendar. The timeline editor exists but is optional.
2. **Mobile-first PWA.** Coordinators live on their phones; every P0 flow works one-handed.
3. **Show the agents working.** A live, human-readable progress view ("Choosing the best 18 moments… Writing a hook… Recording voiceover…") builds trust and makes waiting feel valuable.
4. **Two checkpoints only.** Consent grid and Storyboard. Everything else is automated with sensible defaults.
5. **Safe by default.** Unknown faces blurred, flagged media excluded, approval on — users loosen, never tighten, defaults.
6. **Warm, premium, calm visual language.** Soft neutrals, generous whitespace, large type (older managers, accessibility), tasteful motion. WCAG 2.2 AA minimum.
7. **Instant previews.** Browser-side preview (Remotion Player) before final render so edits feel real-time.

**Key screens:** Home / Today · Event upload · Event brief · Consent grid · Format & style picker · Agent progress · Storyboard · Preview & variants · Approvals inbox · Calendar · Library · Residents & consent · Brand kit · Insights · Settings/Billing.

---

## 9. AI Model Strategy (Nov 2026)

**Principle: model-agnostic router.** The video/image model leaderboard changes every few months, and the sources disagree on who's #1. We put every generative call behind a provider abstraction, keep 2+ providers per capability, and re-run an internal bake-off on real care-home footage every quarter. Defaults below; fallbacks in brackets.

| Capability | Primary | Fallback / notes |
|---|---|---|
| Orchestration, research, scripting, QA | **Claude (latest Opus for planning/story, Sonnet/Haiku for high-volume steps)** via Anthropic API / Agent SDK | Strong long-form writing, tool use, brand-voice adherence. |
| Video/photo understanding (scene detection, best moments) | **Gemini (latest Pro/Flash)** — native long-video input | Claude vision for stills. |
| Image-to-video motion on real photos & B-roll | **Veo 3.1** (character consistency, cinematic camera; Vertex AI with SLA & EU region) | **Kling 3.0** (cheapest, strong human motion), **Runway Gen-4.5** (camera control), **Seedance 2.x** |
| Image generation/edits (posters, title cards, backgrounds, flyers) | **GPT Image 2** (best text rendering) | **FLUX.2** (photoreal, low cost), **Nano Banana Pro** (edits) |
| Voiceover | **ElevenLabs** (best British voices, emotion control) | Cartesia, WellSaid |
| Music | Licensed royalty-free library via API (business-safe) or ElevenLabs Music | Never trending commercial tracks — Meta/TikTok business accounts can't legally use them. |
| Transcription (event audio, voice notes) | ElevenLabs Scribe / Deepgram | Whisper (self-host) |
| Enhancement | Topaz / Real-ESRGAN upscale, stabilisation, colour match | — |
| People detection & blur | AWS Rekognition (London region) / on-device detection | Face *matching* only with opt-in (P1). |

**Guardrails for generative video on real people:** AI motion is limited to subtle camera moves/parallax and ambient motion on residents; no changing faces, bodies, actions or expressions; fully generated footage only for non-person B-roll (pumpkins, autumn leaves, bunting) and titles. Every AI-enhanced asset is labelled internally and, where platforms require, flagged as AI-assisted (Meta/TikTok AI labels, C2PA metadata).

**Indicative cost per 30 s reel** (assumption, Nov 2026 public API prices, to be validated in bake-off): LLM ≈ £0.15 · VO ≈ £0.10 · 3–4 AI motion shots (~20 s at $0.03–0.10/s) ≈ £0.50–1.60 · render & storage ≈ £0.10 → **≈ £1–2 per reel**.

---

## 10. Compliance, Consent & Trust (critical — this is our moat)

- **UK GDPR / DPA 2018:** home = controller, we = processor (DPA agreement, sub-processor list). Lawful basis for marketing images = **consent**, per channel, freely given, withdrawable. UK data residency (AWS eu-west-2 London); EU/US model providers only under IDTA/UK Addendum with zero-retention settings.
- **Biometric data:** face *matching* = special-category biometric data (Art. 9). Default MVP uses detection + manual tagging + blur (no biometric templates). Matching is opt-in per home, with DPIA template, explicit consent, and templates deleted on withdrawal.
- **Mental Capacity Act 2005:** where a resident lacks capacity, record who decided (LPA for health & welfare / best-interests decision), and prompt periodic re-checks when capacity changes.
- **CQC Regulation 10 (Dignity & respect) & Regulation 17 (Good governance):** dignity screen, approval workflow and audit trail support inspection evidence.
- **ASA / CAP Code:** no misleading claims; no fabricated events or people; testimonials must be genuine.
- **Children & visitors:** school children and visitors default to blurred unless consent captured.
- **Security:** SSO (Google/Microsoft) for groups, MFA, role-based access, encryption at rest/in transit, Cyber Essentials Plus in year 1, DSPT (Data Security & Protection Toolkit) compliance for NHS-funded customers.
- **Retention:** raw uploads auto-deleted after configurable period (default 90 days); published assets and consent snapshots retained per policy.

*Legal review required before beta — see Open Questions.*

---

## 11. Technical Architecture & Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js (App Router) + React + TypeScript**, Tailwind CSS, shadcn/ui, Framer Motion, TanStack Query | Fast, premium UI; PWA support; huge ecosystem. |
| In-browser preview & editor | **Remotion Player** (React-based video composition) | Same composition code for live preview and final render. |
| Uploads | Uppy + tus/S3 multipart, client-side HEIC conversion & thumbnailing | Reliable big uploads on mobile/4G. |
| API / backend | **TypeScript (Node) on Next.js route handlers + a separate worker service**; Python microservice for media/ML (FFmpeg, OpenCV) | One language for most of the product; Python where the media tooling lives. |
| Durable agent workflows | **Inngest** (or Temporal Cloud at scale) | Long-running, retryable, step-level observability for multi-agent pipelines; human checkpoints = "wait for event". |
| Agents | **Claude Agent SDK / Anthropic API tool use**, typed tool contracts, structured JSON outputs | Reliable planning/writing; easy to swap sub-models. |
| Generative model gateway | Internal provider router → **fal.ai** (one API across Kling/Seedance/FLUX…), **Google Vertex AI** (Veo, Gemini), OpenAI (GPT Image), ElevenLabs | Fast access to new models; fallbacks; cost control per tenant. |
| Rendering | **Remotion Lambda** on AWS eu-west-2 + FFmpeg | Parallel serverless renders, minutes not hours. |
| Database | **PostgreSQL** (Supabase London region or AWS RDS) + Drizzle ORM; row-level multi-tenancy (group → home → user) | Relational consent/audit data; RLS for isolation. |
| Storage & CDN | **AWS S3 (eu-west-2)** + CloudFront, signed URLs, lifecycle rules | UK residency, cheap, lifecycle deletion. |
| Auth | Clerk (organisations, SSO, MFA) or Supabase Auth | B2B orgs & roles out of the box. |
| Social publishing | Direct APIs: Meta Graph (IG/FB), TikTok Content Posting, YouTube Data, LinkedIn, Google Business Profile; start with an aggregator (e.g. Ayrshare) to ship faster | Platform approvals take weeks — aggregator de-risks launch. |
| Payments | Stripe Billing (GBP, VAT, usage-based credits) | Standard. |
| Analytics & observability | PostHog (EU), Sentry, **Langfuse** (LLM traces/evals), OpenTelemetry | Product analytics + AI quality monitoring. |
| AI evaluation | Golden set of real (consented) care-home events; automated script/visual scoring + human rating each release | Prevent quality regressions when swapping models. |

**Core data model (simplified):** `Group → Home → User(role)` · `Resident(consents[])` · `Event(brief, media[])` · `MediaAsset(people[], flags[], quality)` · `Project(format, style, storyboard, renders[])` · `Post(platform, schedule, status, metrics)` · `AuditEvent`.

---

## 12. Pricing Hypothesis (to validate)

| Plan | Price (per home / month) | Includes |
|---|---|---|
| **Starter** | £79 | 8 reels + unlimited image posts / month, 1 brand kit, 3 users |
| **Growth** | £149 | 20 reels, calendar teasers, insights, family consent portal |
| **Group** | from £119/home (5+ homes) | Group dashboard, SSO, brand inheritance, priority support |

Extra reel credits £3–5. Benchmark: care-sector marketing agencies typically cost several hundred to thousands of £ per month (assumption — verify), so we're priced as a clear saving.

---

## 13. Competitive Landscape

| Alternative | Gap we exploit |
|---|---|
| **CarePress** (care-home PR/marketing software, UK) | PR & content publishing focus; we add agentic video production and consent automation. |
| General social tools (Buffer, Sendible, Planable, ContentStudio) | Schedule what you already made — don't make it. No consent. |
| Editors (Canva, CapCut, Opus Clip) | Need skills & time; no care-specific story or consent safety. |
| Care marketing agencies | Expensive, slow, not daily; we're always-on at a fraction of cost. |
| Doing nothing / phone snaps | Default competitor — our onboarding must beat it in the first 10 minutes. |

**Moat:** consent register + dignity screen + audit trail (trust), care-specific storytelling templates & UK calendar, and a growing dataset of what drives enquiries for care homes.

---

## 14. Success Metrics

**Leading (weeks)**
| Metric | Target | Stretch |
|---|---|---|
| Time from upload → approved reel (human time) | < 10 min | < 5 min |
| Activation: first published reel within 7 days of signup | 70% | 85% |
| Storyboard acceptance without major edits | 60% | 80% |
| Render success rate | 98% | 99.5% |
| Posts per active home per week | 3 | 5 |

**Lagging (months)**
| Metric | Target |
|---|---|
| Social-attributed enquiries per home (90 days) | +25% vs. baseline |
| Logo churn | < 3% / month |
| NPS (managers) | ≥ 45 |
| Consent incidents (published without valid consent) | **0** |
| Gross margin | ≥ 80% |

Measured via PostHog funnels, platform insights APIs, UTM/landing-page tracking, and quarterly customer surveys.

---

## 15. Open Questions

| Question | Owner | Blocking? |
|---|---|---|
| Exact UK GDPR position on processor vs. joint controller when we suggest content; DPIA template for homes | Legal | **Yes** (before beta) |
| Is opt-in face matching worth the biometric compliance burden in v1.x, or is manual tagging fast enough? | Product + Legal | No |
| Which music source gives safe commercial rights on all six platforms at our price point? | Partnerships | **Yes** |
| Meta & TikTok app review timelines for direct publishing; aggregator vs. direct at launch | Engineering | **Yes** |
| Which image-to-video model looks most natural on elderly faces/skin without distortion? (bake-off) | Engineering/AI | **Yes** |
| Do managers want approval on every post or approval-by-exception after trust builds? | Design research | No |
| Will groups pay for lead attribution, or is it a hygiene feature? | Product | No |
| Model providers' data retention/zero-retention agreements & UK transfer mechanism | Legal/Eng | **Yes** |

---

## 16. Timeline & Phasing

| Phase | Weeks | Scope |
|---|---|---|
| **0. Discovery** | 0–4 | 10–15 interviews (coordinators, managers, group marketers); legal review; model bake-off on real consented footage; clickable Figma prototype; 3 design-partner homes signed. |
| **1. MVP build** | 5–14 | P0-1 → P0-15; aggregator publishing; manual tagging + blur consent. |
| **2. Private beta** | 15–20 | 10–20 homes free/discounted; measure time-to-reel, acceptance, enquiries; iterate prompts & templates. |
| **3. Launch** | 21–24 | Paid plans, case studies, care-show presence (e.g. Care Show / Care Home Open Day tie-in). |
| **4. Growth** | 25+ | P1: family portal, insights & lead attribution, group mode, WhatsApp drop-in, teasers. |

**Seasonal hard dates:** launch beta before **Christmas** (peak content season) or, if missed, before **Care Home Open Day** and **Dementia Action Week** in spring.

**Dependencies:** social platform app reviews (Meta, TikTok, Google), model provider DPAs, Stripe UK VAT setup, music licence.

---

## 17. Risks

| Risk | Mitigation |
|---|---|
| Consent failure → reputational/legal damage | Safe defaults, two-person approval, audit log, takedown, insurance. |
| AI distorts residents' faces ("uncanny") | Restrict motion strength, face-preservation checks, human storyboard approval, fallback to Ken-Burns. |
| Model costs spike / provider disappears | Router + fallbacks, per-tenant credit limits, cache outputs. |
| Low tech confidence of users | Mobile-first, templates, onboarding call, WhatsApp drop-in. |
| Platform policy changes (AI labels, music) | Licensed music only, C2PA, monitor policies. |

---

## Sources (research, Nov 2026)

- Video models: [OpenRouter – image-to-video compared](https://openrouter.ai/blog/insights/image-to-video-models-compared/), [videogen.io ranking](https://videogen.io/best-ai-video-models), [invideo – best video models](https://invideo.io/blog/best-ai-video-generation-models/), [pixazo comparison](https://www.pixazo.ai/blog/ai-video-generation-models-comparison)
- Video API pricing: [devtk.ai – video API pricing 2026](https://devtk.ai/en/blog/ai-video-generation-pricing-2026/), [fal.ai image-to-video](https://fal.ai/learn/tools/ai-image-to-video-generators)
- Image models: [atlascloud comparison](https://www.atlascloud.ai/blog/best-ai-image-generation-models-2026), [wavespeed guide](https://wavespeed.ai/blog/posts/best-ai-image-generators-2026), [cometapi – GPT Image 2](https://www.cometapi.com/best-chatgpt-model-for-image-generation-in-2026/)
- Voice: [DIY AI – British accent TTS](https://diyai.io/ai-tools/audio-generation/best-ai-british-accent-tts/), [inference.sh – ElevenLabs alternatives](https://inference.sh/blog/alternatives-elevenlabs-alternatives)
- Consent & capacity: [Care Industry News – MCA & marketing consent](https://www.careindustrynews.co.uk/?p=125014), [Age UK photography policy](https://www.ageuk.org.uk/bp-assets/contentassets/a18b2133f58b4a51bcfdc6ab05e55127/policys/auke-photography-policy-v1.pdf), [Baker Donelson – CMS on resident social posts (US comparison)](https://bakerdonelson.com/cms-warns-against-social-media-postings-involving-nursing-facility-residents)
- Competitors: [CarePress on Capterra UK](https://www.capterra.co.uk/software/1103072/CarePress), [Capterra UK social tools](https://www.capterra.co.uk/blog/3504/top-social-media-marketing-tools-in-UK), [Care Learning – social media for care homes](https://carelearning.org.uk/blog/marketing/social-media-for-care-providers-guide)

> Figures marked "assumption" and model rankings must be re-validated during Phase 0; the AI model landscape moves quarterly.
