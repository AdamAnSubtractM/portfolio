# Portfolio monorepo

The source for [adamknee.dev](https://adamknee.dev). One pnpm workspace holds the site, the Sanity Studio, and the shared query package.

| Path                      | What it is                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| `apps/site`               | The Astro site. It deploys to Cloudflare Workers. See [apps/site/README.md](apps/site/README.md). |
| `apps/studio`             | The Sanity Studio and the content schema. See [apps/studio/README.md](apps/studio/README.md).     |
| `packages/sanity-queries` | The GROQ queries and the generated types. The site imports it as `@adam/portfolio-sanity`.        |

## How the parts connect

```
apps/studio  --schema-->  pnpm typegen  -->  packages/sanity-queries  <--imports--  apps/site
     |                                                                                   |
     +---- edits content in Sanity (project 0gpal1hv, dataset production) <-- GROQ ------+
```

The resume, the cover letters, and the portfolio come from Sanity at build time. Only the blog posts live in the repository. A new Sanity document appears on the site only after a new deploy.

## Setup

Use Node 24 and pnpm 10. The `.node-version` file sets Node.

```sh
pnpm install
```

Make `apps/site/.env` and `apps/studio/.env`. The variable names are in each app README and in `apps/studio/.env.example`.

## Commands

Run all commands from the repository root.

```sh
pnpm dev               # site dev server at http://localhost:4321
pnpm studio            # Sanity Studio dev server
pnpm build             # site: astro check + astro build
pnpm build:withResume  # site build, then the resume PDF
pnpm typegen           # regenerate packages/sanity-queries/sanity.types.ts from the studio schema
pnpm deploy:local      # build, make the PDF, wrangler deploy (CI does this on a push to main)

pnpm lint              # Oxlint
pnpm fmt               # Oxfmt
pnpm check             # Oxfmt + Oxlint check. The site type-check runs in pnpm build.
```

The Vite+ config is `vite.config.ts` at the root. It covers `apps/site` and `packages/*`. The studio keeps its own ESLint and Prettier. Run them with `pnpm --filter portfolio-sanity-studio lint`.

## Deploy

A push to `main` runs `.github/workflows/deploy.yml`. The workflow builds the site, generates the resume PDF, and runs `wrangler deploy` from `apps/site`.

- Cloudflare Workers Builds is turned off for this Worker. Its build container lacks the system libraries that Chromium needs, so it cannot make the PDF. Do not turn it on.
- A pull request runs the same build and a dry-run deploy. It keeps the PDF as an artifact.
- `workflow_dispatch` starts a deploy by hand from the Actions tab. A Sanity webhook calls the same trigger when you publish content. See _Sanity webhook_ below.
- The workflow needs the secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. It needs the variables `PUBLIC_SANITY_STUDIO_PROJECT_ID` and `PUBLIC_SANITY_STUDIO_DATASET`.

### Sanity webhook

A Sanity webhook starts a deploy when you publish content, so a new resume variant goes live without a manual step.

- URL: `https://api.github.com/repos/AdamAnSubtractM/portfolio/actions/workflows/deploy.yml/dispatches`, method POST.
- Body (projection): `{"ref": "main"}`.
- Headers: `Authorization: Bearer <token>`, `Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28`.
- Token: a fine-grained GitHub token for this repository only, with the repository permission "Actions: write" and no other permission. The token `portfolio-sanity-deploy-webhook` expires on **2027-10-30**. Before then, make a new token with the same settings and replace the `Authorization` header in the Sanity webhook. A dead token fails quietly: publishes still work, but the site does not update.
- Trigger: dataset `production`, on create, update, and delete. Drafts and versions are off, so only a publish starts a deploy. The API version is `2024-11-16`. Filter on the document types the site reads: `resume`, `coverLetter`, `experience`, `education`, `skills`, `portfolioPiece`, `portfolioGallery`, `contactInfo`, `social`, `logo`, `tag`.
- The workflow queues deploys and does not cancel a running one. GitHub keeps only the newest waiting run, so a burst of edits makes at most one extra deploy.

The studio deploys by hand. Run `pnpm run deploy` in `apps/studio` after a schema change.

## Dependencies

Dependabot opens one grouped pull request each month for minor and patch updates. It covers the root, `apps/*`, and `packages/*`.

A major update needs a manual change. Two pins exist on purpose:

- `typescript` stays on `~6.0.3`. `@astrojs/check` and `@typescript-eslint` do not support version 7.
- `@types/node` stays on `^24`. The project runs Node 24.

## Design notes

- The queries package replaces the old JSR package. A schema change, its query change, and the site fix now go in one pull request. No publish step exists.
- The package ships TypeScript source and has no build step.
- The Worker name `portfolio` comes from `apps/site/package.json`. Do not rename that package. The Cloudflare Worker name must match it.

## License

Personal portfolio code — not intended for redistribution. Vector art is the author's own work.
