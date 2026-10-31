# CLAUDE.md

Guidance for Claude Code at the repository root. Each app has its own `CLAUDE.md`: `apps/site/CLAUDE.md` and `apps/studio/CLAUDE.md`. Read the one for the app that you change.

## Project

Adam Knee's portfolio (https://adamknee.dev). A pnpm workspace with three packages:

- `apps/site` — Astro static site on Cloudflare Workers. Package name `portfolio`.
- `apps/studio` — Sanity Studio. Package name `portfolio-sanity-studio`.
- `packages/sanity-queries` — GROQ queries and generated types. Package name `@adam/portfolio-sanity`. The site imports it. It ships TypeScript source and has no build step.

The resume, the cover letters, and the portfolio pieces come from Sanity at build time. Only blog posts live in the repository.

## Commands

Use `pnpm` (pinned in `packageManager`, Node `^24.0.0`). Run commands from the root.

- `pnpm dev` — site dev server. `pnpm studio` — Studio dev server.
- `pnpm build` — site `astro check` and `astro build`. `pnpm build:withResume` adds the resume PDF.
- `pnpm typegen` — regenerate `packages/sanity-queries/sanity.types.ts` from the studio schema. Commit the result.
- `pnpm lint`, `pnpm fmt`, `pnpm check` — Vite+ (`vp`). They cover `apps/site` and `packages/*`. The studio keeps its own ESLint and Prettier.
- `pnpm deploy:local` — build, make the PDF, `wrangler deploy`. Do not type bare `pnpm deploy`. It is a built-in pnpm command, and a script with that name needs `pnpm run deploy`.

## Deploy and CI

- `.github/workflows/deploy.yml` deploys on a push to `main`. It installs Chromium, runs `build:withResume`, and runs `wrangler deploy` from `apps/site`.
- Cloudflare Workers Builds is disabled (`auto_build_enabled: false`). Its build container lacks `libatk-1.0.so.0`, so Chromium cannot start. Do not turn it on. The resume PDF is not in Git, so a Workers Build deploys a site with no PDF.
- A pull request runs the build and a dry-run deploy. It never publishes.
- A Sanity webhook can start a deploy. It sends a `repository_dispatch` event with the type `sanity-publish`.
- The `cf` CLI can read and change the Workers Builds settings: `cf builds workers get|update <script-tag>` and `cf builds logs get <build-uuid>`. The script tag for `portfolio` is found with `cf workers scripts search --name portfolio`.

## Sanity contract

`packages/sanity-queries/queries.ts` is the contract between the studio schema and the site. A field rename or removal in `apps/studio/schemaTypes/` that a query reads breaks the site. Change the schema, the query, the regenerated types, and the site code in one pull request. Run `pnpm typegen`, `pnpm build`, and `pnpm check`.

## Rules for this repository

- Keep the package name `portfolio` in `apps/site/package.json`. The Cloudflare Worker name must match it.
- Do not commit the resume PDF. `apps/site/scripts/generate-resume.ts` writes it to `apps/site/dist/client/`.
- `typescript` stays on `~6.0.x` and `@types/node` stays on `^24`. See the root README for the reason.
- A `git fetch` in this repository must update `origin/main`. The remote has a fetch refspec set. If `origin/main` looks stale, run `git ls-remote origin main` and compare.
