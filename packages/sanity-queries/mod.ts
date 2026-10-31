/**
 * Generated TypeScript types and GROQ queries for the portfolio Sanity studio.
 *
 * This package is the contract between the studio that owns the schema and the
 * Astro site that consumes it. Each query exported here is paired with a
 * `*_RESULT` type generated from the studio's schema by `sanity typegen` —
 * pass the query to a Sanity client and annotate the fetch with the matching
 * result type to get fully-typed responses.
 *
 * @example
 * ```ts
 * import { createClient } from '@sanity/client';
 * import {
 *   RESUME_QUERY,
 *   type RESUME_QUERY_RESULT
 * } from '@adam/portfolio-sanity';
 *
 * const client = createClient({ projectId: '…', dataset: 'production', apiVersion: '2024-11-16' });
 * const resume = await client.fetch<RESUME_QUERY_RESULT>(RESUME_QUERY, { slug: 'portfolio' });
 * ```
 *
 * @module
 */

import {
  RESUME_QUERY as _RESUME_QUERY,
  COVER_LETTER_QUERY as _COVER_LETTER_QUERY,
  PORTFOLIO_GALLERY_QUERY as _PORTFOLIO_GALLERY_QUERY
} from './queries';

import type {
  RESUME_QUERY_RESULT as _RESUME_QUERY_RESULT,
  COVER_LETTER_QUERY_RESULT as _COVER_LETTER_QUERY_RESULT,
  PORTFOLIO_GALLERY_QUERY_RESULT as _PORTFOLIO_GALLERY_QUERY_RESULT
} from './sanity.types';

/**
 * GROQ query that fetches a single `resume` document by slug, dereferencing
 * the linked `logo`, `contactInfo` (with all `social` documents inlined),
 * `experience[]`, `education[]`, and `skills[]` references.
 *
 * Bind to a `slug` parameter and use {@link RESUME_QUERY_RESULT} as the
 * fetch result type.
 *
 * @example
 * ```ts
 * const resume = await client.fetch<RESUME_QUERY_RESULT>(RESUME_QUERY, { slug: 'portfolio' });
 * ```
 */
export const RESUME_QUERY: string = _RESUME_QUERY;

/**
 * GROQ query that fetches a single `coverLetter` document by `_id`,
 * dereferencing the linked `logo` and `contactInfo` (with all `social`
 * documents inlined).
 *
 * Bind to an `id` parameter and use {@link COVER_LETTER_QUERY_RESULT} as
 * the fetch result type.
 *
 * @example
 * ```ts
 * const letter = await client.fetch<COVER_LETTER_QUERY_RESULT>(COVER_LETTER_QUERY, { id });
 * ```
 */
export const COVER_LETTER_QUERY: string = _COVER_LETTER_QUERY;

/**
 * GROQ query that fetches a single `portfolioGallery` document by slug,
 * dereferencing each linked `portfolioPiece` (and that piece's `tags[]`),
 * and projecting `featuredImage.asset->url` to `featuredImageUrl` plus each
 * section's `image.asset->url` to `imageUrl`.
 *
 * Bind to a `slug` parameter and use {@link PORTFOLIO_GALLERY_QUERY_RESULT}
 * as the fetch result type.
 *
 * @example
 * ```ts
 * const gallery = await client.fetch<PORTFOLIO_GALLERY_QUERY_RESULT>(
 *   PORTFOLIO_GALLERY_QUERY,
 *   { slug: 'best-showcase' }
 * );
 * ```
 */
export const PORTFOLIO_GALLERY_QUERY: string = _PORTFOLIO_GALLERY_QUERY;

/**
 * Shape of the data returned by {@link RESUME_QUERY}.
 *
 * The top level is the `resume` document with its references resolved:
 * `logo` is projected to `{ svgUrl, pngUrl }`, `contactInfo` is the inlined
 * `contactInfo` document with `socials[]` populated from all `social`
 * documents, and `experience[]` / `education[]` / `skills[]` are arrays of
 * the dereferenced documents. The result is `null` when no resume matches
 * the slug.
 */
export type RESUME_QUERY_RESULT = _RESUME_QUERY_RESULT;

/**
 * Shape of the data returned by {@link COVER_LETTER_QUERY}.
 *
 * The top level is the `coverLetter` document with its references resolved:
 * `logo` is projected to `{ svgUrl, pngUrl }` and `contactInfo` is the
 * inlined `contactInfo` document with `socials[]` populated from all
 * `social` documents. The result is `null` when no cover letter matches
 * the id.
 */
export type COVER_LETTER_QUERY_RESULT = _COVER_LETTER_QUERY_RESULT;

/**
 * Shape of the data returned by {@link PORTFOLIO_GALLERY_QUERY}.
 *
 * The top level is the `portfolioGallery` document with `pieces[]` resolved
 * to dereferenced `portfolioPiece` documents. Inside each piece,
 * `featuredImage` is projected to `featuredImageUrl`, `tags[]` are
 * dereferenced `tag` documents, and each section projects its `image` to
 * `imageUrl`. The result is `null` when no gallery matches the slug.
 */
export type PORTFOLIO_GALLERY_QUERY_RESULT = _PORTFOLIO_GALLERY_QUERY_RESULT;
