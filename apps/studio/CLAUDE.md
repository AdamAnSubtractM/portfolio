# CLAUDE.md

Guidance for `apps/studio`, the Sanity Studio behind adamknee.dev. The studio is the source of truth for the schema. The queries and the generated types are in `packages/sanity-queries`, which `apps/site` imports.

## Critical coupling

`packages/sanity-queries/queries.ts` holds the GROQ queries. `sanity.types.ts` there is generated from this schema. `apps/site` imports both as the workspace package `@adam/portfolio-sanity`. The packages are in the same repository, so a schema change and its site fix go in one pull request.

A schema field rename or removal that touches a query field breaks the site. When editing schema:

1. Update the matching field in `packages/sanity-queries/queries.ts`.
2. Run `pnpm typegen` from the root and commit the regenerated `sanity.types.ts`.
3. Run `pnpm build` and `pnpm check` from the root. Grep `apps/site/src` for direct field references that the type system cannot catch.

Do not ship a schema edit without all three steps.

## Folder convention

```
schemaTypes/
  index.ts        — single source of truth for the studio's `schemaTypes` array
  documents/      — top-level document types (resume, coverLetter, portfolioPiece, ...)
  objects/        — reusable inline objects (portfolioSection)
  fields/         — field-builder helper functions (richTextField, dateRangeFields)
structure/        — custom desk structure (groups documents into Site Content / Building Blocks / Identity)
sanity.cli.ts     — CLI + TypeGen config; reads and writes in ../../packages/sanity-queries

packages/sanity-queries/ (not in this folder)
  queries.ts      — groq-tagged queries; sole input to TypeGen's query-result generation
  sanity.types.ts — generated; do not edit by hand
  mod.ts          — public surface: the queries and the 3 query-result types
```

## Style

- Validation: `(rule) => rule.required()` — lowercase `rule`, no exceptions.
- Field names: camelCase (`startDate`, not `startdate`).
- Prefer `richTextField({ name, title, required })` over repeating `defineField({ type: 'array', of: [defineArrayMember({ type: 'block' })], ... })`.
- Prefer `dateRangeFields({ dateFormat })` over redefining `startDate`/`endDate` per document.

## Deploys

Single dataset (`production`) and single Studio host (`knee-portfolio`). Local Studio and hosted Studio both edit the same content.

- `pnpm run deploy` (in `apps/studio`) — pushes the Studio bundle to `https://knee-portfolio.sanity.studio`. Required after schema changes; not needed for content edits.
- `pnpm dataset:export` — backs up the production dataset to `./dataset-backups`. Run before risky schema/content edits.
