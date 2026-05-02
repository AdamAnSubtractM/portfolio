import { createClient } from '@sanity/client';
import type { SanityClient } from '@sanity/client';
import type { PortableTextBlock } from '@portabletext/types';

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

export function sanityImg(url: string | undefined, opts: SanityImgOpts = {}): string | undefined {
  if (!url) return url;
  const params = new URLSearchParams();
  params.set('auto', 'format');
  if (opts.w) params.set('w', String(opts.w));
  if (opts.h) params.set('h', String(opts.h));
  params.set('fit', opts.fit ?? 'max');
  params.set('q', String(opts.q ?? 80));
  return `${url}?${params}`;
}

export type SanitySlug = { _type?: 'slug'; current: string };

export type PortfolioTag = { title: string; slug: SanitySlug };

export type PortfolioSection = {
  heading?: string;
  description?: PortableTextBlock | PortableTextBlock[];
  imageUrl?: string;
};

export type PortfolioPiece = {
  title: string;
  description: string;
  featuredImageUrl: string;
  slug: SanitySlug;
  tags?: PortfolioTag[];
  sections?: PortfolioSection[];
  launchUrl?: string;
  repoUrl?: string;
};

export type PortfolioGallery = {
  slug: string;
  title?: string;
  intro?: PortableTextBlock | PortableTextBlock[];
  showTagsFilter?: boolean;
  pieces: PortfolioPiece[];
};

// Resume and cover-letter shapes aren't typed yet — leaving as `any` preserves the
// existing call-site ergonomics. Tighten in a follow-up alongside the Sanity schema.
const resumeCache = new Map<string, Promise<any>>();
export function getResume(slug: string = 'portfolio'): Promise<any> {
  let cached = resumeCache.get(slug);
  if (!cached) {
    const query = `*[_type == "resume" && slug.current == $slug][0] {
      ...,
      logo->{
        "svgUrl": svg.asset->url,
        "pngUrl": png.asset->url
      },
      "contactInfo": contactInfo->{
        ...,
        "socials": *[_type == "social"]
      },
      "experience": experience[]->{...},
      "education": education[]->{...},
      "skills": skills[]->{...},
      educationEnabled
    }`;
    cached = buildClient.fetch(query, { slug });
    resumeCache.set(slug, cached);
  }
  return cached;
}

export function getCoverLetter(id: string): Promise<any> {
  const query = `*[_type == "coverLetter" && _id == $id][0] {
    ...,
    logo->{
      "svgUrl": svg.asset->url,
      "pngUrl": png.asset->url
    },
    "contactInfo": contactInfo->{
      ...,
      "socials": *[_type == "social"]
    }
  }`;
  return liveClient.fetch(query, { id });
}

const portfolioCache = new Map<string, Promise<PortfolioGallery | null>>();
export function getPortfolioPieces(slug: string = 'best-showcase'): Promise<PortfolioGallery | null> {
  let cached = portfolioCache.get(slug);
  if (!cached) {
    const query = `*[_type == "portfolioGallery" && slug.current == $slug][0]{
      "slug": slug.current,
      title,
      intro,
      showTagsFilter,
      "pieces": pieces[]->{
        title,
        description,
        "featuredImageUrl": featuredImage.asset->url,
        slug,
        tags[]->{
          title,
          slug
        },
        sections[]{
          heading,
          description,
          "imageUrl": image.asset->url
        },
        launchUrl,
        repoUrl
      }
    }`;
    cached = buildClient.fetch<PortfolioGallery | null>(query, { slug });
    portfolioCache.set(slug, cached);
  }
  return cached;
}

export default buildClient;
