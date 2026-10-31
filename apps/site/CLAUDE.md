# CLAUDE.md

Guidance for `apps/site`. The repository root `CLAUDE.md` covers the monorepo, the CI deploy, and the shared tooling.

## Project

Adam Knee's personal portfolio site (https://adamknee.dev) — an Astro static site deployed to Cloudflare. Most page content (resume, cover letters, portfolio pieces) is sourced from a Sanity CMS at build time; only blog posts live in the repo as Markdown/MDX.

## Commands

Run from the repository root, or from `apps/site` with `pnpm run <script>`. Lint, format, and test run from the root through Vite+ (`vp`). Framework commands stay on `astro`.

- `pnpm dev` — dev server at `localhost:4321`
- `pnpm build` — runs `astro check` (type-check) then `astro build`. Output is fully static.
- `pnpm build:withResume` — build site, then run `generate:resume` (renders the resume page to PDF via headless Chromium).
- `pnpm --filter portfolio generate:cover-letter <id>` — renders `localhost:4321/cover-letter/<id>` to a PDF in `apps/site/cover-letters/`. Requires `pnpm dev` to be running.
- `pnpm deploy:local` — build:withResume, then `wrangler deploy`. In `apps/site`, the script is `pnpm run deploy`. Bare `pnpm deploy` is a built-in pnpm command.

## Architecture

### Rendering model

- `astro.config.ts` sets `output: 'static'` with `@astrojs/cloudflare` adapter and `inlineStylesheets: 'auto'`. Most routes prerender at build; `src/pages/cover-letter/[id].astro` opts out via `export const prerender = false` and runs as an on-demand server route on Cloudflare Workers, which is why `astro build` reports `mode: "server"` even with static output.
- Static dynamic routes use `getStaticPaths()` driven by Sanity queries. `src/pages/portfolio/[slug].astro` makes the portfolio pieces. `src/pages/resume/[slug].astro` makes one page for each resume variant. A new piece or variant appears only after a rebuild. `/resume/` is the base resume (slug `portfolio`). A variant page is `noindex` and is not in the sitemap (`astro.config.ts`).

### Sanity (CMS)

- All Sanity access goes through `src/utils/sanity.ts`. The GROQ queries and the result types come from the workspace package `@adam/portfolio-sanity` (`packages/sanity-queries`). The helpers are `getResume`, `getResumeSlugs`, `getCoverLetter`, and `getPortfolioPieces`. The queries flatten references inline (e.g. `experience[]->{...}`, asset URLs resolved into `featuredImageUrl`/`svgUrl`).
- Env vars: `PUBLIC_SANITY_STUDIO_PROJECT_ID`, `PUBLIC_SANITY_STUDIO_DATASET` (see `apps/site/.env`). `sanity.ts` throws if either is missing.
- There are two clients. `buildClient` uses the CDN and serves the prerendered routes. `liveClient` does not use the CDN and serves the cover-letter route.
- The queries use `$slug` and `$id` parameters. Do not interpolate values into GROQ strings.

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

1. Load the rendered HTML (resume: the `/resume/` route of `dist/client/`, served by an inline static server; cover letter: live from `localhost:4321/cover-letter/<id>` — dev server must be running).
2. Inject `font-size: <Xem>` into `#pdf`, render to PDF, count pages.
3. If page count exceeds the target, shrink the font and retry. This auto-fit loop is the reason `PDFLayout` standardizes on `#pdf` and `em`-based sizing — anything new in the resume/cover-letter must scale with the parent font-size.
4. The resume script makes `adam-knee-resume.pdf` from `/resume/` and `adam-knee-<slug>.pdf` from each `/resume/<slug>/` variant, all in `dist/client/` only. Pass a slug to make one PDF. `PrintResumeButton` builds the same names. The PDF is never committed. Cloudflare Workers Builds can't run headless Chromium, so `.github/workflows/deploy.yml` builds, generates the PDF, and deploys. Workers Builds must stay disabled. `pnpm deploy:local` does the same from the repository root.

### Writing to Sanity (`scripts/sanity-write.ts`)

`pnpm sanity:resume <slug> <content.json>` and `pnpm sanity:cover-letter <content.json>` build documents from a JSON file. The builders and the Portable Text helper are in `scripts/lib/` and have unit tests. The default is a dry run. `--apply` writes drafts. `--apply --publish` writes published documents. The token is `SANITY_WRITE_TOKEN` in `apps/site/.env`. Never print it. The script refuses the base slug `portfolio`. Document ids are fixed and keys come from a hash, so a re-run changes nothing else. Format and options are in `README.md`.

### Styling tokens

Global CSS variables (`--color-*`, `--space-*`, `--font-size-*`, `--radius-*`, `--size-width-content`) are defined in `src/styles/global.css` and consumed everywhere. PDF layout adds its own `--gap-*` scale on top.

### Content collections

Only `blog` is a content collection. Schema is in `src/content.config.ts` (Astro content-layer API, with `glob` loader from `astro/loaders` and Zod from `astro/zod`). Posts live in `src/content/blog/` as `.md` / `.mdx` and are addressed by `entry.id` (not the legacy `slug`). Resume, cover letters, and portfolio are NOT content collections — they come from Sanity.

### Tooling (Vite+)

`vite.config.ts` at the repository root holds the Vite+ tooling config (`lint`, `fmt`, `test` blocks). It is **separate from Astro's bundling** — Astro's vite settings still live inside `apps/site/astro.config.ts`. Oxfmt does not yet support `.astro` files, so they're listed in `fmt.ignorePatterns`. Oxlint's `typeAware`/`typeCheck` fields appear in its TypeScript types but are rejected by the runtime parser as of oxlint 1.62 — leave them out.
