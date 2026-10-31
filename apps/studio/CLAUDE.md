# CLAUDE.md

Sanity Studio backing the adamknee.com Astro site. The studio is the source of truth for the schema and ships its types + queries to consumers as the JSR package `@adam/portfolio-sanity`.

## Critical coupling

`mod.ts` re-exports the contents of `queries.ts` (GROQ strings) and selected types from `sanity.types.ts`. Consumers depend on the published package — there is **no filesystem dependency** between this repo and the consumer.

Any schema field rename or removal that touches a query field is a breaking change for consumers. When editing schema:

1. Update the matching field in `queries.ts`.
2. Run `pnpm typegen` and commit the regenerated `sanity.types.ts`.
3. Bump `version` in `jsr.json`. `pnpm publish:types:dry` to validate, then `pnpm publish:types` to ship.
4. In the consumer repo, bump the `@adam/portfolio-sanity` version, `pnpm install`, run its typecheck. Grep the consumer source for any direct field references the type system can't catch.

Don't ship a schema edit without all four steps.

## Folder convention

```
schemaTypes/
  index.ts        — single source of truth for the studio's `schemaTypes` array
  documents/      — top-level document types (resume, coverLetter, portfolioPiece, ...)
  objects/        — reusable inline objects (portfolioSection)
  fields/         — field-builder helper functions (richTextField, dateRangeFields)
structure/        — custom desk structure (groups documents into Site Content / Building Blocks / Identity)
queries.ts        — groq-tagged queries; sole input to TypeGen's query-result generation
sanity.types.ts   — generated; do not edit by hand
mod.ts            — JSR package entry point; documented re-exports of queries + the 3 query-result types only (schema document types stay internal)
jsr.json          — JSR manifest (name, version, exports, file include list)
sanity.cli.ts     — CLI + TypeGen config; `overloadClientMethods: false` keeps the output JSR-publishable
```

## Style

- Validation: `(rule) => rule.required()` — lowercase `rule`, no exceptions.
- Field names: camelCase (`startDate`, not `startdate`).
- Prefer `richTextField({ name, title, required })` over repeating `defineField({ type: 'array', of: [defineArrayMember({ type: 'block' })], ... })`.
- Prefer `dateRangeFields({ dateFormat })` over redefining `startDate`/`endDate` per document.

## Deploys

Single dataset (`production`) and single Studio host (`knee-portfolio`). Local Studio and hosted Studio both edit the same content.

- `pnpm deploy` — pushes the Studio bundle to `https://knee-portfolio.sanity.studio`. Required after schema changes; not needed for content edits.
- `pnpm dataset:export` — backs up the production dataset to `./dataset-backups`. Run before risky schema/content edits.
