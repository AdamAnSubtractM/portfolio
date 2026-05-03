# astro-cf-portfolio

Adam Knee's personal portfolio site at [adamknee.dev](https://adamknee.dev). Built with [Astro 6](https://astro.build), deployed to [Cloudflare](https://www.cloudflare.com), with content sourced from a [Sanity](https://www.sanity.io) CMS at build time. Interactive islands use [SolidJS](https://www.solidjs.com). Tooling runs through [Vite+](https://viteplus.dev).

## Stack

| Concern         | Choice                                                        |
| --------------- | ------------------------------------------------------------- |
| Framework       | Astro 6 (`output: 'static'`)                                  |
| Adapter         | `@astrojs/cloudflare` (one on-demand route, rest prerendered) |
| Islands         | SolidJS via `@astrojs/solid-js`                               |
| CMS             | Sanity (GROQ over `@sanity/client`)                           |
| Toolchain       | Vite+ (Oxlint, Oxfmt, Vitest, `vp run`)                       |
| Package manager | pnpm 10                                                       |
| Runtime         | Node 24 LTS                                                   |
| PDF             | Headless Chromium via `playwright-chromium` + `pdf-lib`       |

## Prerequisites

- Node 24 (`.node-version` is honored by `nvm`/`fnm`/`asdf`)
- pnpm 10
- A Sanity dataset; see [Environment](#environment)

## Setup

```sh
pnpm install
```

Then create a `.env` (gitignored) with:

```env
PUBLIC_SANITY_STUDIO_PROJECT_ID=...
PUBLIC_SANITY_STUDIO_DATASET=production
PUBLIC_SANITY_STUDIO_HOST=...
```

`PROJECT_ID` and `DATASET` are read via `import.meta.env` in `src/utils/sanity.ts`. `STUDIO_HOST` is consumed by the separate Sanity Studio project.

## Commands

```sh
pnpm dev                          # Astro dev server at http://localhost:4321
pnpm build                        # astro check + astro build
pnpm preview                      # serve dist/ locally
pnpm build:withResume             # build site, then render the resume PDF
pnpm generate:cover-letter <id>   # render a cover letter PDF (requires `pnpm dev` running)

# Tooling (Vite+)
pnpm lint                         # vp lint  → Oxlint
pnpm fmt                          # vp fmt   → Oxfmt
pnpm format                       # vp fmt + vp lint
pnpm check                        # vp check (fmt + lint + type-check)
pnpm test                         # vp test  → Vitest (no suites yet)
```

## Architecture

### Rendering model

`output: 'static'` with the Cloudflare adapter. Almost every route prerenders at build; one route (`src/pages/cover-letter/[id].astro`) sets `export const prerender = false` and runs as an on-demand server route on a Cloudflare Worker. That's why `astro build` reports `mode: "server"` even with static output.

### Content sources

| Surface                                                       | Source                                                       | Notes                                                                                                                                  |
| ------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Resume (`/resume`)                                            | Sanity, build time                                           | One GROQ query per `slug`, memoized in `src/utils/sanity.ts`. Defaults to slug `portfolio`.                                            |
| Portfolio gallery + pieces (`/portfolio`, `/portfolio/:slug`) | Sanity, build time                                           | One fat query in `getPortfolioPieces()`; piece data is passed through `getStaticPaths` props so detail pages don't refetch.            |
| Cover letters (`/cover-letter/:id`)                           | Sanity, request time                                         | Uses a non-CDN client so edits surface immediately. Marked `noindex, nofollow`.                                                        |
| Blog (`/blog`, `/blog/:id`)                                   | Astro content collection (`src/content/blog/`, `.md`/`.mdx`) | Schema in `src/content.config.ts` using the Astro 6 content-layer API (`glob` loader, `astro/zod`). Posts are addressed by `entry.id`. |
| RSS (`/rss.xml`)                                              | Same content collection                                      | Endpoint at `src/pages/rss.xml.js`.                                                                                                    |

### Sanity client

`src/utils/sanity.ts` exports two clients:

- `buildClient` — `useCdn: true`. Faster, free, fine for prerendered routes.
- `liveClient` — `useCdn: false`. Used only by the on-demand cover-letter route.

All GROQ queries use `$param` placeholders and `client.fetch(query, params)` — never string interpolation. Slugs are validated by Sanity itself rather than being trusted as plain text.

`getResume()` and `getPortfolioPieces()` are memoized at module scope so two pages calling them during the same build only hit Sanity once.

### Components

- `src/components/astro/` — server-rendered building blocks (`BlurredCard`, `DateRange`, `FormattedDate`, `NotFound`, `PortfolioSection`, `StickyWrapper`, plus PDF-specific components in `pdf/`).
- `src/components/solid/` — interactive islands hydrated with `client:load` (nav, carousel, contact form, tooltips, buttons, icon SVGs that live inside Solid trees).
- `src/components/solid/style-modules/` — CSS Modules consumed by Solid components.
- `src/layouts/` — page-level layouts.
- `src/layouts/partials/` — header / footer / `<head>` chrome that's only ever rendered inside `BaseLayout`.

`tsconfig.json` sets `jsxImportSource: 'solid-js'`, so `.tsx` files in this repo are SolidJS, not React.

### Layouts

```
BaseLayout       header + main nav + footer + ClientRouter (view transitions)
└─ ThemedLayout  + theme tokens, used by almost every page
   └─ PDFLayout  + #pdf container sized to US Letter, hides chrome under @media print
```

`PDFLayout` is the target of both PDF generation scripts. Anything new in the resume/cover-letter must scale with the parent `font-size: <Xem>` because the auto-fit loop adjusts that single rule until the PDF fits.

### Styling

- `src/styles/global.css` — design tokens (`--color-*`, `--space-*`, `--font-size-*`, `--radius-*`, `--size-width-content`).
- Astro components use scoped `<style>` blocks plus `:global(...)` for cross-component selectors.
- Solid components use CSS Modules.
- `astro.config.ts` sets `inlineStylesheets: 'auto'` (Astro's default). Small CSS gets inlined; larger sheets remain external so the browser can cache them across view-transition navigations.

### Images

- **Local assets** live in `src/assets/` and are imported as modules so Astro's `<Image>` / `getImage()` can pick them up (build fingerprinting, format negotiation, sized variants).
- **Sanity assets** are loaded from `cdn.sanity.io` URLs. The `sanityImg(url, { w, h, q, fit })` helper in `src/utils/sanity.ts` appends Sanity's URL-transform params (`?w=…&auto=format&fit=max&q=80`) so the CDN serves a per-context variant in webp/avif. Use it everywhere a Sanity image is rendered.
- The image service is `sharpImageService()`, but because the cover-letter route is server-rendered, Astro runs in hybrid mode and the Cloudflare adapter routes `<Image>` / `getImage()` URLs through the `/_image` runtime endpoint. Each unique URL is resolved by the Worker once, then CDN-cached.
- Static assets that don't go through Astro's image pipeline (favicon, OG images, SVGs) live in `public/`.

## PDF generation

Both `scripts/generate-resume.ts` and `scripts/generate-cover-letter.ts` use `playwright-chromium` + `pdf-lib`. The fundamental loop:

1. Load the rendered HTML.
2. Inject `font-size: <Xem>` into `#pdf` via `page.evaluate`.
3. Render to PDF, count pages.
4. If the page count exceeds the target, shrink font-size and retry.

### `pnpm build:withResume`

**Local-only.** Cloudflare Pages CI can't launch headless Chromium (no GTK libs in the build sandbox), so the resume PDF is generated locally and committed to `public/`. CI just runs `pnpm build`, and Astro's normal `public/ → dist/client/` copy ships the latest committed PDF.

Re-run `pnpm build:withResume` and commit `public/adam-knee-resume.pdf` whenever the resume content in Sanity changes.

The script:

- Builds the site, then spins up an inline static HTTP server pointing at `dist/client/`.
- `page.goto`s `http://127.0.0.1:<port>/resume/` so absolute `/_astro/...` asset paths resolve correctly. (Loading via `file://` would break external stylesheets.)
- `page.emulateMedia({ media: 'print' })` so `@media print` rules in `PDFLayout` and `global.css` apply.
- Binary-searches font-size between 0.5em and 1.0em for the largest size that fits within `desiredPageCount` (currently 3) pages.
- Writes `public/adam-knee-resume.pdf`.

### `pnpm generate:cover-letter <id>`

Requires `pnpm dev` running in another terminal — it loads `http://localhost:4321/cover-letter/<id>` directly. Output lands in `cover-letters/` (gitignored).

## Vite+ tooling

`vite.config.ts` at the project root holds Vite+ config (`lint`, `fmt`, `test` blocks). It is **separate from Astro's bundling** — Astro's vite settings still live inside `astro.config.ts`. Notes:

- Oxfmt does not yet support `.astro` files (oxc-project/oxc#19715), so they're listed in `fmt.ignorePatterns`. Format `.astro` manually if needed until the upstream lands.
- Oxlint's `typeAware` / `typeCheck` config keys appear in its TypeScript types but are rejected by the runtime parser as of oxlint 1.62. Leave them out.
- `vp install` delegates to whatever package manager `package.json#packageManager` declares (pnpm here).

## Deployment

Deployed to **Cloudflare Workers** (Workers Static Assets). The `@astrojs/cloudflare` adapter produces:

- `dist/client/` — static assets (HTML, CSS, JS, images) served by the Workers Static Assets binding
- `dist/server/` — the Worker code that handles the on-demand `/cover-letter/[id]` route, plus `wrangler.json` (auto-generated config: name, bindings, compatibility date)
- `.wrangler/deploy/config.json` — a redirect that lets `wrangler deploy` find the generated config

### One-time setup

```sh
pnpm exec wrangler login   # authenticate against your Cloudflare account
```

### Each deploy

```sh
pnpm run deploy            # builds, then deploys via wrangler
pnpm run deploy:dryrun     # builds + validates without uploading
```

The first `wrangler deploy` will:

- Create a Worker named `portfolio` (from `package.json:name`)
- Auto-provision a KV namespace for the `SESSION` binding (declared by the adapter; not actively used by the site, but harmless)
- Bind to Cloudflare Images via `IMAGES` (dormant — image transforms run through `sharpImageService()` at the runtime endpoint)
- Upload `dist/client/*` as static assets
- Print the public `<name>.workers.dev` URL

### Bindings (declared automatically by the adapter)

| Binding       | Resource                               | Used?                                                                                         |
| ------------- | -------------------------------------- | --------------------------------------------------------------------------------------------- |
| `env.ASSETS`  | Workers Static Assets (`dist/client/`) | Yes — serves all prerendered HTML and `_astro/*`                                              |
| `env.SESSION` | KV namespace (auto-provisioned)        | No — site doesn't use Astro sessions, declaration is dormant                                  |
| `env.IMAGES`  | Cloudflare Images binding              | No — `<Image>` / `getImage()` go through Astro's `/_image` runtime endpoint, not this binding |

To remove the dormant bindings, configure the adapter in `astro.config.ts` with `cloudflare({ sessionKVBindingName: undefined, imagesBindingName: undefined })` — but they cost nothing as declarations.

### Custom domain

Custom domains are bound in the Workers dashboard (Workers & Pages → portfolio → Settings → Domains & Routes → Add). DNS for the apex needs to point at Cloudflare's nameservers; the proxy handles routing.

### CI (Cloudflare Workers Builds)

Configure under Workers & Pages → portfolio → Settings → Build → Connect a repository.

| Field          | Value                                             |
| -------------- | ------------------------------------------------- |
| Branch         | `main`                                            |
| Root directory | `/`                                               |
| Build command  | `pnpm run build:withResume`                       |
| Deploy command | `npx wrangler deploy` (the default — leave alone) |

`build:withResume` runs `astro build` and then `generate-resume.ts`, which writes the regenerated PDF to **both** `public/` (for local dev) and `dist/client/` (for the deploy). Without that dual-write, `wrangler` would upload a stale PDF — `astro build` copies `public/` → `dist/client/` _before_ the resume regenerates.

Required environment variables (Build → Variables and Secrets):

| Name                              | Value                      | Type      |
| --------------------------------- | -------------------------- | --------- |
| `PUBLIC_SANITY_STUDIO_PROJECT_ID` | _(your Sanity project ID)_ | Plaintext |
| `PUBLIC_SANITY_STUDIO_DATASET`    | `production`               | Plaintext |

Astro replaces `import.meta.env.PUBLIC_*` statically at build time, so values get baked into both the prerendered HTML and the worker bundle.

## Project map

```
.
├── astro.config.ts             # Astro framework config
├── vite.config.ts              # Vite+ tooling config (lint, fmt, test)
├── tsconfig.json               # extends astro/tsconfigs/strict
├── postcss.config.cjs
├── package.json
├── public/                     # static assets, generated PDFs
├── cover-letters/              # generated cover-letter PDFs (gitignored)
├── scripts/
│   ├── generate-resume.ts
│   └── generate-cover-letter.ts
└── src/
    ├── consts.ts               # SITE_TITLE, SITE_DESCRIPTION
    ├── content.config.ts       # blog content collection (Astro 6 content layer)
    ├── content/blog/           # *.md / *.mdx posts
    ├── assets/                 # imported (build-optimized) images — about bg, blog placeholders
    ├── components/
    │   ├── astro/              # server-rendered building blocks
    │   │   └── pdf/            # PDF-specific (PDFHeader, ResumeDocument, etc.)
    │   └── solid/              # interactive islands (.tsx, Solid)
    │       └── style-modules/  # CSS Modules for solid components
    ├── layouts/
    │   ├── BaseLayout.astro
    │   ├── ThemedLayout.astro
    │   ├── BlogPostLayout.astro
    │   ├── PDFLayout.astro
    │   └── partials/           # Header, Footer, BaseHead (used only by BaseLayout)
    ├── pages/
    │   ├── index.astro
    │   ├── about.astro
    │   ├── contact.astro
    │   ├── portfolio.astro
    │   ├── portfolio/[slug].astro
    │   ├── resume.astro
    │   ├── blog/index.astro
    │   ├── blog/[...slug].astro
    │   ├── cover-letter/[id].astro    # on-demand SSR route
    │   └── rss.xml.js
    ├── styles/global.css
    └── utils/
        ├── formatDate.ts        # used by DateRange.astro
        └── sanity.ts            # GROQ helpers, types, dual clients, memoization
```

## License

Personal portfolio code — not intended for redistribution. Vector art is the author's own work.
