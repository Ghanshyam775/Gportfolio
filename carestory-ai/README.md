# CareStory AI (working name)

An AI content studio for UK care homes. Staff upload photos and videos from an activity or party and add a few details. A pipeline of agents then checks consent, picks a trend format, writes the story and builds a branded reel or image post ready to publish.

- 📄 [Product Requirements Document](./PRD.md)
- 💻 [MVP app](./app): Next.js 15, TypeScript, Tailwind v4

## Run it

```bash
cd app
npm install
npm run dev        # http://localhost:3000
```

To see the whole flow in about a minute, open **Try the Halloween demo** on the home screen.

## What works today (MVP prototype)

| Area | Status |
|---|---|
| Event-first wizard: brief (event templates, highlights, voice note), bulk upload, consent check, format & style, agent run | ✅ |
| **Consent guard**: per-channel resident register, tagging people per photo, drag-to-blur faces (pixelated in every export), "someone else visible" flag, dignity screen with manager override that is logged | ✅ |
| **Agent pipeline** (ingest → consent → research → story → director → production → QA), streamed live to the UI | ✅ (mock providers) |
| Storyboard editor: edit text and voiceover lines, reorder, swap media, change duration and camera motion, add or delete scenes | ✅ |
| Canvas renderer: Ken Burns motion, crossfades, cinematic vignette, captions, branded title and outro (CTA, phone, CQC badge), watermark | ✅ |
| **Export a real video file** (MP4 or WebM, recorded in the browser), carousel and single posts as JPG | ✅ |
| Voice preview with the browser's British voice | ✅ |
| Captions for each platform (Instagram, Facebook, TikTok, YouTube, LinkedIn, Google Business), hashtags, alt text | ✅ |
| Approvals (Coordinator → Manager), request changes, scheduling, consent re-checked before approval | ✅ |
| Content calendar with planned activities, scheduled posts and UK awareness days | ✅ |
| Brand kit (logo, colours, fonts, tone, voice, music mood, CTA, CQC badge) with a live preview | ✅ |
| Consent withdrawal takes down every affected story in one click; audit log exports to CSV | ✅ |
| Mobile-first PWA layout | ✅ |

## Architecture

```
app/src
├─ app/                    # Next.js App Router pages
│  ├─ api/agents/run       # POST → NDJSON stream of agent progress + storyboard
│  └─ api/providers        # which AI providers are configured
├─ lib/
│  ├─ agents/pipeline.ts   # multi-agent pipeline (server-side, pure steps → easy to move to Inngest/Temporal)
│  ├─ ai/providers.ts      # provider interfaces + mock adapters + registry (swap point for real models)
│  ├─ ai/knowledge.ts      # event templates, style presets, trend formats, UK awareness days, voices
│  ├─ consent.ts           # consent guard rules (safe by default)
│  ├─ render/renderer.ts   # canvas renderer shared by preview and export
│  ├─ media.ts             # IndexedDB media store, image normalisation, video probing
│  └─ store.ts             # Zustand store (localStorage) mirroring the PRD data model
└─ components/             # ReelPlayer, Slides, ConsentEditor, AgentRun, AppShell…
```

## Next steps: integrations (`app/.env.example`)

1. **Claude** (`ANTHROPIC_API_KEY`): replace `mockResearcher` and `mockWriter` in `lib/ai/providers.ts`. Keep the same `StoryDraft` JSON shape.
2. **ElevenLabs** (`ELEVENLABS_API_KEY`): `VoiceProvider.synthesize`. Mix the audio into the render.
3. **Veo 3.1 / Kling 3.0** (`GOOGLE_VERTEX_PROJECT` / `FAL_KEY`): apply subtle image-to-video to scenes marked `aiMotion`.
4. **Gemini** for scene detection and best-moment scoring in the ingest agent.
5. **Backend**: Postgres (London region) + S3 eu-west-2 uploads to replace `store.ts` and IndexedDB; auth with orgs and roles (Clerk or Supabase).
6. **Rendering**: Remotion Lambda for server-side MP4 at 1080p with audio.
7. **Publishing**: Ayrshare first, then direct Meta, TikTok, YouTube, LinkedIn and Google Business APIs.
8. **Legal**: DPIA, processor agreement, and a review of the consent flows before beta (PRD §10).
