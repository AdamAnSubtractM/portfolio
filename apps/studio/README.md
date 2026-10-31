# Sanity Studio (`apps/studio`)

The Sanity Studio for [adamknee.dev](https://adamknee.dev). It owns the schema for the resume, the cover letters, and the portfolio. The queries and the generated types are in `packages/sanity-queries`.

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
| `pnpm typegen` | Extract schema → JSON, then generate `packages/sanity-queries/sanity.types.ts` (document types + query result types). Commit the result. |
| `pnpm typegen:extract` | Schema-only extract step (rarely run on its own). |
| `pnpm lint` | ESLint (flat config in `eslint.config.mjs`). |
| `pnpm format` | Prettier write + lint. |
| `pnpm dataset:export` | Export the `production` dataset to `./dataset-backups`. Run before risky schema or content edits. |
| `pnpm run deploy` | Deploy the Studio bundle to `https://knee-portfolio.sanity.studio`. |
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

## Schema ↔ site coupling

The site reads from the studio through the three GROQ queries in `packages/sanity-queries/queries.ts`:

- `RESUME_QUERY` — uses `resume.slug.current`, dereferences `logo`, `contactInfo`, `experience[]`, `education[]`, `skills[]`. Reads `educationEnabled` and `highlights`.
- `COVER_LETTER_QUERY` — uses `coverLetter._id`, dereferences `logo` + `contactInfo`, reads every cover-letter prose field.
- `PORTFOLIO_GALLERY_QUERY` — uses `portfolioGallery.slug.current`, dereferences `pieces[]` and (per piece) `tags[]`, projects `featuredImage.asset->url` to `featuredImageUrl` and `image.asset->url` to `imageUrl` inside each section.

**Renaming or removing any field these queries touch breaks the site.** When you make schema edits:

1. Update `packages/sanity-queries/queries.ts` in the same change.
2. Run `pnpm typegen` from the repository root. Commit the regenerated `sanity.types.ts`.
3. Run `pnpm build` and `pnpm check` from the root. The site type-check shows each broken field.

## TypeGen

`pnpm typegen` runs `sanity schema extract` and then `sanity typegen generate`. The config is in `sanity.cli.ts`. It reads `../../packages/sanity-queries/queries.ts` and writes `../../packages/sanity-queries/sanity.types.ts`. `overloadClientMethods: false` keeps the generated file free of the `declare module '@sanity/client'` augmentation. The package has its own `.prettierrc`, so the generated file keeps the same quote style.

## Conventions

- **Validation arg name:** `(rule) => rule.required()` — lowercase, consistent across all schemas.
- **Field naming:** camelCase (`startDate`, not `startdate`). Field renames break the site. See *Schema ↔ site coupling* above.
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

# 3. Push the new Studio bundle to the hosted host. Run it from apps/studio.
pnpm run deploy
```

Do not type `pnpm deploy`. That is a built-in pnpm command and not this script.
