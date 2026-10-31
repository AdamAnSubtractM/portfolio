# @adam/portfolio-sanity

Generated TypeScript types and GROQ queries for the Sanity Studio that backs [adamknee.com](https://adamknee.com). The studio owns the schema for the resume, cover letter, and portfolio gallery; this package is the contract its consumer uses.

## Installation

```bash
# JSR (recommended)
pnpm dlx jsr add @adam/portfolio-sanity

# or, with @jsr scope already configured in .npmrc:
pnpm add @adam/portfolio-sanity
```

## Usage

```ts
import { createClient } from '@sanity/client';
import {
  RESUME_QUERY,
  COVER_LETTER_QUERY,
  PORTFOLIO_GALLERY_QUERY,
  type RESUME_QUERY_RESULT,
  type COVER_LETTER_QUERY_RESULT,
  type PORTFOLIO_GALLERY_QUERY_RESULT
} from '@adam/portfolio-sanity';

const client = createClient({
  projectId: '0gpal1hv',
  dataset: 'production',
  apiVersion: '2024-11-16'
});

const resume = await client.fetch<RESUME_QUERY_RESULT>(RESUME_QUERY, { slug: 'portfolio' });
const letter = await client.fetch<COVER_LETTER_QUERY_RESULT>(COVER_LETTER_QUERY, { id });
const gallery = await client.fetch<PORTFOLIO_GALLERY_QUERY_RESULT>(PORTFOLIO_GALLERY_QUERY, { slug: 'best-showcase' });
```

## What's in the package

The published surface is six symbols — three GROQ query strings paired with three result types:

| Query | Result type | Fetches |
|---|---|---|
| `RESUME_QUERY` | `RESUME_QUERY_RESULT` | A resume by slug, with logo / contactInfo / experience / education / skills dereferenced. |
| `COVER_LETTER_QUERY` | `COVER_LETTER_QUERY_RESULT` | A cover letter by `_id`, with logo / contactInfo dereferenced. |
| `PORTFOLIO_GALLERY_QUERY` | `PORTFOLIO_GALLERY_QUERY_RESULT` | A portfolio gallery by slug, with each piece's references and image asset URLs projected. |

Both queries (runtime values) and types are shipped together because the result types only describe the shape produced by their paired query.

The full set of generated document types from the schema (Resume, CoverLetter, etc.) lives in the package but is intentionally not re-exported from the entry point — those are studio internals, not consumer-facing.

---

# Studio (contributor docs)

The rest of this document covers the Sanity Studio that produces this package — how to run it, edit the schema, and ship changes.

- **Sanity project ID:** `0gpal1hv`
- **Dataset:** `production` (single source of truth — local Studio and hosted Studio both edit it)
- **Studio host:** `knee-portfolio` (deployed at `https://knee-portfolio.sanity.studio`)

## Setup

```bash
pnpm install
cp .env.example .env   # fill in real values
pnpm dev               # http://localhost:3333
```

`.env` provides `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET`, and `SANITY_STUDIO_HOST` to the Studio config (see `sanity.config.ts`).

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | Run the Studio locally against the dataset configured in `.env` (default: `production`). |
| `pnpm build` | Build the production bundle into `./dist`. |
| `pnpm typecheck` | `tsc --noEmit` over the studio code. |
| `pnpm typegen` | Extract schema → JSON, then generate `sanity.types.ts` (document types + query result types). Commit the result. |
| `pnpm typegen:extract` | Schema-only extract step (rarely run on its own). |
| `pnpm publish:types` | Publish the package to JSR. Bump `version` in `jsr.json` first. |
| `pnpm publish:types:dry` | Same as above with `--dry-run` — validates the package without publishing. |
| `pnpm lint` | ESLint (flat config in `eslint.config.mjs`). |
| `pnpm format` | Prettier write + lint. |
| `pnpm dataset:export` | Export the `production` dataset to `./dataset-backups`. Run before risky schema or content edits. |
| `pnpm deploy` | Deploy the Studio bundle to `https://knee-portfolio.sanity.studio`. |
| `pnpm deploy:graphql` | Publish the GraphQL API for the production dataset. |

## Schema map

Documents live in `schemaTypes/documents/`. Reusable objects in `schemaTypes/objects/`. Shared field-builder helpers in `schemaTypes/fields/`.

**Top-level content (edited directly):**
- `resume` → references `logo`, `contactInfo`, `experience[]`, `education[]`, `skills[]`. Has `slug`, `educationEnabled` toggle, and a rich-text `highlights` field.
- `coverLetter` → references `logo` + `contactInfo`. Holds the per-letter prose (`openingParagraph`, `keyHighlights`, `closingParagraph`, etc.).
- `portfolioGallery` → references `portfolioPiece[]`, ordered. Has a `slug` and `showTagsFilter` toggle.

**Building blocks (referenced by the above):**
- `portfolioPiece` → `tags[]` (refs to `tag`), inline `sections[]` (each is a `portfolioSection` object), plus `featuredImage`, `launchUrl`, `repoUrl`.
- `experience`, `education` → use the shared `dateRangeFields` helper for `startDate` / `endDate`.
- `skills` → titled rich-text section.
- `tag` → label + slug, used for portfolio piece classification.

**Identity:**
- `contactInfo` → name, title, email, `socials[]` (refs to `social`).
- `social` → platform + URL.
- `logo` → SVG and/or PNG file (validates that at least one is provided).

The custom desk structure (`structure/index.ts`) groups the document list into **Site Content**, **Building Blocks**, and **Identity**.

## Schema ↔ consumer coupling

The Astro site that consumes this package reads from the studio via the three GROQ queries in `queries.ts`:

- `RESUME_QUERY` — uses `resume.slug.current`, dereferences `logo`, `contactInfo`, `experience[]`, `education[]`, `skills[]`. Reads `educationEnabled` and `highlights`.
- `COVER_LETTER_QUERY` — uses `coverLetter._id`, dereferences `logo` + `contactInfo`, reads every cover-letter prose field.
- `PORTFOLIO_GALLERY_QUERY` — uses `portfolioGallery.slug.current`, dereferences `pieces[]` and (per piece) `tags[]`, projects `featuredImage.asset->url` to `featuredImageUrl` and `image.asset->url` to `imageUrl` inside each section.

**Renaming or removing any field these queries touch is a breaking change for the consumer.** When you make schema edits:

1. Update `queries.ts` in the same change.
2. Run `pnpm typegen`, commit the regenerated `sanity.types.ts`.
3. Bump `version` in `jsr.json`, then `pnpm publish:types`.
4. In the consumer repo, bump the `@adam/portfolio-sanity` semver and `pnpm install` to surface any breaks.

## TypeGen + JSR publishing

`pnpm typegen` runs `sanity schema extract` then `sanity typegen generate`, reading the queries in `queries.ts` and producing `sanity.types.ts`.

The studio's `mod.ts` re-exports the queries plus the three query-result types as the public surface of the JSR package (manifest in `jsr.json`).

`overloadClientMethods: false` is set in `sanity-typegen.json` so the generated file omits the `declare module '@sanity/client'` augmentation — JSR rejects ambient module declarations as "slow types."

### Publish flow

```bash
pnpm typegen                       # regenerate sanity.types.ts
# bump "version" in jsr.json
pnpm publish:types:dry             # validate
pnpm publish:types                 # interactive auth on first run
```

After publishing, bump `@adam/portfolio-sanity` in the consumer's `package.json` and `pnpm install`.

## Conventions

- **Validation arg name:** `(rule) => rule.required()` — lowercase, consistent across all schemas.
- **Field naming:** camelCase (`startDate`, not `startdate`). Field renames are breaking — see *Schema ↔ consumer coupling* above.
- **Folder layout:** `documents/` for document types, `objects/` for reusable inline objects, `fields/` for field-builder helpers. Keep the flat `schemaTypes/index.ts` as the only export surface.
- **Shared helpers:** prefer `richTextField` (block-array shorthand) and `dateRangeFields` (start/end date pair) over repeating field definitions.

## Deploy flow

There is one dataset (`production`) and one Studio host. Local Studio and the hosted Studio at `knee-portfolio.sanity.studio` both edit the same content.

**Editing content** — open the hosted Studio (or run `pnpm dev` locally) and publish. The next portfolio build picks up the change. No deploy step needed.

**Shipping a schema change** — schema edits live in this repo, so they require a Studio bundle redeploy:

```bash
# 1. Edit schema + queries, regenerate types, commit.
pnpm typegen
git add . && git commit

# 2. Optional but recommended for risky edits — back up content first.
pnpm dataset:export

# 3. Push the new Studio bundle to the hosted host.
pnpm deploy

# 4. Publish the consumer types (see "TypeGen + JSR publishing" above).
```
