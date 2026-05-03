import { createClient } from '@sanity/client';
import type { SanityClient } from '@sanity/client';
import type { PortableTextBlock } from '@portabletext/types';
import {
  RESUME_QUERY,
  COVER_LETTER_QUERY,
  PORTFOLIO_GALLERY_QUERY,
  type RESUME_QUERY_RESULT,
  type COVER_LETTER_QUERY_RESULT,
  type PORTFOLIO_GALLERY_QUERY_RESULT
} from '@adam/portfolio-sanity';

const baseConfig = {
  projectId: import.meta.env.PUBLIC_SANITY_STUDIO_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_STUDIO_DATASET,
  apiVersion: '2024-11-16'
};

// CDN-backed client: faster + free, used for build-time prerendered content.
const buildClient: SanityClient = createClient({ ...baseConfig, useCdn: true });

// Live API client: used for the on-demand cover-letter route so edits surface immediately.
const liveClient: SanityClient = createClient({ ...baseConfig, useCdn: false });

// Sanity's image pipeline supports query-string transforms (resize, format, quality). Append them
// to any `cdn.sanity.io/images/...` URL to get a context-appropriate variant served from the CDN
// — much cheaper than shipping the full source asset and downscaling in the browser.
export type SanityImgOpts = {
  w?: number;
  h?: number;
  q?: number;
  fit?: 'crop' | 'max' | 'fill' | 'fillmax' | 'min' | 'scale';
};

export function sanityImg(url: string | null | undefined, opts: SanityImgOpts = {}): string | undefined {
  if (!url) return undefined;
  const params = new URLSearchParams();
  params.set('auto', 'format');
  if (opts.w) params.set('w', String(opts.w));
  if (opts.h) params.set('h', String(opts.h));
  params.set('fit', opts.fit ?? 'max');
  params.set('q', String(opts.q ?? 80));
  return `${url}?${params}`;
}

export type Resume = RESUME_QUERY_RESULT;
export type CoverLetter = COVER_LETTER_QUERY_RESULT;
export type PortfolioGallery = NonNullable<PORTFOLIO_GALLERY_QUERY_RESULT>;
export type PortfolioPiece = NonNullable<PortfolioGallery['pieces']>[number];
export type PortfolioSection = NonNullable<PortfolioPiece['sections']>[number];
export type PortfolioTag = NonNullable<PortfolioPiece['tags']>[number];
export type SanitySlug = NonNullable<PortfolioPiece['slug']>;

const resumeCache = new Map<string, Promise<Resume | null>>();
export function getResume(slug: string = 'portfolio'): Promise<Resume | null> {
  let cached = resumeCache.get(slug);
  if (!cached) {
    cached = buildClient.fetch<Resume | null>(RESUME_QUERY, { slug });
    resumeCache.set(slug, cached);
  }
  return cached;
}

export function getCoverLetter(id: string): Promise<CoverLetter | null> {
  return liveClient.fetch<CoverLetter | null>(COVER_LETTER_QUERY, { id });
}

const portfolioCache = new Map<string, Promise<PortfolioGallery | null>>();
export function getPortfolioPieces(slug: string = 'best-showcase'): Promise<PortfolioGallery | null> {
  let cached = portfolioCache.get(slug);
  if (!cached) {
    cached = buildClient.fetch<PortfolioGallery | null>(PORTFOLIO_GALLERY_QUERY, { slug });
    portfolioCache.set(slug, cached);
  }
  return cached;
}

// Re-export PortableTextBlock for downstream consumers that previously imported it from this module.
export type { PortableTextBlock };

export default buildClient;
