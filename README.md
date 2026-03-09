# Gravii LP 2

Gravii LP 2 is a custom landing page built with Next.js 16, React 19, Bun, GSAP, and a raw WebGPU hero background.

The site is structured as a single-page experience with layered motion, section-by-section reveals, custom typography, and a GPU-rendered hero scene. It also includes optional CMS and waitlist integrations inherited from the Satūs starter foundation.

## Stack

- Next.js 16.1.1
- React 19.2.3
- TypeScript 5.9
- Bun 1.3.5
- Turbopack for default `dev` and `build`
- GSAP for reveal and scroll-driven motion
- CSS Modules for section-specific styling
- Raw WebGPU for the hero background renderer

## Requirements

- Node.js `>= 22`
- Bun `>= 1.3.5`

## Getting Started

1. Install dependencies:

```bash
bun install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Start the development server:

```bash
bun dev
```

4. Open:

```text
http://localhost:3000
```

## Available Scripts

| Command | Description |
| --- | --- |
| `bun dev` | Start the development server with Turbopack |
| `bun run dev:webpack` | Start the development server with webpack fallback |
| `bun run build` | Production build with Turbopack |
| `bun run build:webpack` | Production build with webpack fallback |
| `bun start` | Start the production server |
| `bun run lint` | Run Biome lint checks |
| `bun run lint:fix` | Apply Biome fixes |
| `bun run format` | Format the codebase with Biome |
| `bun run typecheck` | Run `tsgo --noEmit` |
| `bun run typecheck:tsc` | Run `tsc --noEmit` |
| `bun run setup:styles` | Regenerate style configuration files |

## Project Overview

The main page is assembled in:

- [app/(site)/page.tsx](/Users/kxwxn/Gravii/Gravii-Lp-2/app/(site)/page.tsx)

Current section order:

1. `Hero`
2. `IntroOne`
3. `IntroTwo`
4. `Persona`
5. `MarqueeCopy`
6. `MarqueeNumbers`
7. `Waitlist`

Key implementation areas:

- Hero WebGPU background:
  [components/sections/hero/hero-background.tsx](/Users/kxwxn/Gravii/Gravii-Lp-2/components/sections/hero/hero-background.tsx)
- WebGPU renderer internals:
  [lib/webgpu/pipeline.ts](/Users/kxwxn/Gravii/Gravii-Lp-2/lib/webgpu/pipeline.ts)
- Header:
  [components/layout/sticky-header/index.tsx](/Users/kxwxn/Gravii/Gravii-Lp-2/components/layout/sticky-header/index.tsx)
- Persona section:
  [components/sections/persona/index.tsx](/Users/kxwxn/Gravii/Gravii-Lp-2/components/sections/persona/index.tsx)
- Waitlist section:
  [components/sections/waitlist/index.tsx](/Users/kxwxn/Gravii/Gravii-Lp-2/components/sections/waitlist/index.tsx)

## Directory Structure

```text
app/
  (site)/                Main landing page route and server actions
  layout.tsx             Root layout
  robots.ts              Robots metadata
  sitemap.ts             Sitemap generation
  manifest.ts            Web app manifest

components/
  layout/                Header, wrapper, footer, scrolling shell
  sections/              Hero, intro, persona, marquee, waitlist
  effects/               GSAP helpers and reusable motion components
  ui/                    Reusable primitives

lib/
  webgpu/                Raw WebGPU context, GLB parsing, pipeline
  webgl/                 Optional WebGL infrastructure from the base template
  hooks/                 Shared hooks
  styles/                Fonts, generated style config, CSS foundation
  utils/                 Metadata, fetch, waitlist, math, rate limiting

public/
  fonts/                 Custom local fonts
  models/                GLB assets used by the hero scene
```

## Environment Variables

The full reference lives in:

- [.env.example](/Users/kxwxn/Gravii/Gravii-Lp-2/.env.example)

Common variables:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_BASE_URL` | Canonical site URL used for metadata and SEO |
| `SOURCE_MAPS` | Enable production browser source maps when set to `true` |
| `ANALYZE` | Enable bundle analysis |
| `NEXT_PUBLIC_FACEBOOK_APP_ID` | Optional social metadata |

Optional integrations supported by the base project:

- Sanity
- Shopify
- HubSpot
- Mailchimp
- Mandrill
- Cloudflare Turnstile

## Waitlist Integration

Server-side waitlist submission logic exists here:

- [app/(site)/actions.ts](/Users/kxwxn/Gravii/Gravii-Lp-2/app/(site)/actions.ts)

There is also a fully wired client form component here:

- [components/sections/waitlist/form.tsx](/Users/kxwxn/Gravii/Gravii-Lp-2/components/sections/waitlist/form.tsx)

At the moment, the visible landing section uses a presentational input/button layout in:

- [components/sections/waitlist/index.tsx](/Users/kxwxn/Gravii/Gravii-Lp-2/components/sections/waitlist/index.tsx)

If you want real submissions from the live landing page, wire `WaitlistForm` into the visible section or replace the current presentational form markup with the integrated form component.

## WebGPU Notes

The hero background uses a raw WebGPU renderer instead of Three.js or React Three Fiber.

Important constraints:

- The current model pipeline is `GLB`-based, not `SVG` or `EPS`
- Browser support and rendering behavior can differ between Chromium-based browsers and Firefox
- For model or texture issues, check:
  - [lib/webgpu/glb.ts](/Users/kxwxn/Gravii/Gravii-Lp-2/lib/webgpu/glb.ts)
  - [lib/webgpu/pipeline.ts](/Users/kxwxn/Gravii/Gravii-Lp-2/lib/webgpu/pipeline.ts)

If WebGPU is unavailable, the hero falls back to a static background layer.

## Deployment

Recommended deployment target:

- Vercel

Deployment checklist:

1. Configure `.env.local` locally and matching environment variables in the hosting platform
2. Run:

```bash
bun run lint
bun run build
```

3. Verify:
   - hero renders correctly
   - section animations work
   - waitlist flow is wired if required
   - metadata routes (`robots.txt`, `sitemap.xml`, `manifest.webmanifest`) resolve correctly

The project was verified locally with:

```bash
bun run lint
bun run build
```

## Troubleshooting

### `Unable to acquire lock at .next/dev/lock`

Another `next dev` process is already running in the same repo. Stop the old process first, then restart `bun dev`.

### Port 3000 is already in use

Another local process is listening on that port. Either stop it or use the new port Next.js assigns automatically.

### Hero models render incorrectly in one browser only

That is typically a browser-specific WebGPU texture or upload path issue, not necessarily a broken model file.

### Styles look stale

Regenerate style config and restart the server:

```bash
bun run setup:styles
bun dev
```

## Notes

- This repository currently has no commit history on `main`, so change provenance cannot be reconstructed from Git history yet.
- The codebase still contains optional template infrastructure from Satūs even though the landing page is now heavily customized.

## Credits

Built on top of the Satūs starter by darkroom.engineering, then customized for Gravii LP 2.
