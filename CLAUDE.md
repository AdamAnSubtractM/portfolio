# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Adam Knee's personal portfolio site (https://adamknee.dev) — an Astro static site deployed to Cloudflare. Most page content (resume, cover letters, portfolio pieces) is sourced from a Sanity CMS at build time; only blog posts live in the repo as Markdown/MDX.

## Commands

Use `pnpm` (pinned via `packageManager`, Node `^24.0.0`). Lint/format/test are routed through Vite+ (`vp`); framework commands stay on `astro`.

- `pnpm dev` — dev server at `localhost:4321`
- `pnpm build` — runs `astro check` (type-check) then `astro build`. Output is fully static.
- `pnpm build:withResume` — build site, then run `generate:resume` (renders the resume page to PDF via headless Chromium).
- `pnpm generate:cover-letter <id>` — renders `localhost:4321/cover-letter/<id>` to a PDF in `cover-letters/`. Requires `pnpm dev` to be running.
- `pnpm lint` (`vp lint`) — Oxlint. `pnpm fmt` (`vp fmt`) — Oxfmt. `pnpm format` runs both. `pnpm check` (`vp check`) runs fmt + lint + type-check.
- `pnpm preview` — serve the built site locally.

## Architecture

### Rendering model

- `astro.config.mjs` sets `output: 'static'` with `@astrojs/cloudflare` adapter and `inlineStylesheets: 'always'`. Most routes prerender at build; `src/pages/cover-letter/[id].astro` opts out via `export const prerender = false` and runs as an on-demand server route on Cloudflare Workers, which is why `astro build` reports `mode: "server"` even with static output.
- Static dynamic routes (`src/pages/portfolio/[slug].astro`) use `getStaticPaths()` driven by Sanity queries — new portfolio pieces only appear after a rebuild.

### Sanity (CMS)

- All Sanity access goes through `src/utils/sanity.ts`. Queries are GROQ; the helpers (`getResume`, `getCoverLetter`, `getPortfolioPieces`, `getPortfolioPiece`) flatten references inline (e.g. `experience[]->{...}`, asset URLs resolved into `featuredImageUrl`/`svgUrl`).
- Env vars: `PUBLIC_SANITY_STUDIO_PROJECT_ID`, `PUBLIC_SANITY_STUDIO_DATASET` (see `.env`). `useCdn: false` — builds always hit the live API.
- Sanity slug args are interpolated directly into GROQ strings; treat slugs as trusted build-time inputs only.

### Components: Astro vs SolidJS

- `src/components/astro/` — server-rendered, used for layout/structure/PDF.
- `src/components/solid/` — interactive client components (nav, carousel, tooltips, buttons). Hydrated explicitly with `client:load` etc. `tsconfig.json` sets `jsxImportSource: "solid-js"` — all `.tsx` here is Solid, not React.
- Solid components use CSS Modules from `src/components/solid/style-modules/`. Astro components use scoped `<style>` blocks plus `:global(...)` for cross-component selectors.

### Layouts

- `BaseLayout` → header + main nav + footer + `ClientRouter` (view transitions).
- `ThemedLayout` wraps `BaseLayout` with theme tokens; almost every page uses this.
- `PDFLayout` wraps `ThemedLayout` and adds an `#pdf` container sized to US Letter (794×1123px). It hides chrome under `@media print` and is the target of both PDF generation scripts.

### PDF generation (`scripts/`)

Both `generate-resume.ts` and `generate-cover-letter.ts` use `playwright-chromium` + `pdf-lib`:

1. Load the rendered HTML (resume: from `dist/google-application/index.html` after build; cover letter: live from `localhost:4321/cover-letter/<id>` — dev server must be running).
2. Inject `font-size: <Xem>` into `#pdf`, render to PDF, count pages.
3. If page count exceeds the target, shrink the font and retry. This auto-fit loop is the reason `PDFLayout` standardizes on `#pdf` and `em`-based sizing — anything new in the resume/cover-letter must scale with the parent font-size.
4. Resume script currently reads from the `google-application` route (not `resume`); if you change which route gets exported, update `htmlSource` and the output filename.

### Styling tokens

Global CSS variables (`--color-*`, `--space-*`, `--font-size-*`, `--radius-*`, `--size-width-content`) are defined in `src/styles/global.css` and consumed everywhere. PDF layout adds its own `--gap-*` scale on top.

### Content collections

Only `blog` is a content collection. Schema is in `src/content.config.ts` (Astro 6 content-layer API, with `glob` loader from `astro/loaders` and Zod from `astro/zod`). Posts live in `src/content/blog/` as `.md` / `.mdx` and are addressed by `entry.id` (not the legacy `slug`). Resume, cover letters, and portfolio are NOT content collections — they come from Sanity.

### Tooling (Vite+)

`vite.config.ts` at the project root holds the Vite+ tooling config (`lint`, `fmt`, `test` blocks). It is **separate from Astro's bundling** — Astro's vite settings still live inside `astro.config.mjs`. Oxfmt does not yet support `.astro` files, so they're listed in `fmt.ignorePatterns`. Oxlint's `typeAware`/`typeCheck` fields appear in its TypeScript types but are rejected by the runtime parser as of oxlint 1.62 — leave them out.
