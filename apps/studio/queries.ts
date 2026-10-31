import groq from 'groq';

// These queries are the contract between the studio's schema and the consuming Astro site.
// Editing them regenerates the consumer's result types via `pnpm typegen`.

/**
 * GROQ query that fetches a single `resume` document by slug, dereferencing
 * the linked `logo`, `contactInfo` (with all `social` documents inlined),
 * `experience[]`, `education[]`, and `skills[]` references.
 *
 * Bind to a `slug` parameter. Use `RESUME_QUERY_RESULT` as the fetch result type.
 */
export const RESUME_QUERY: string = groq`*[_type == "resume" && slug.current == $slug][0] {
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

/**
 * GROQ query that fetches a single `coverLetter` document by `_id`,
 * dereferencing the linked `logo` and `contactInfo` (with all `social`
 * documents inlined).
 *
 * Bind to an `id` parameter. Use `COVER_LETTER_QUERY_RESULT` as the fetch result type.
 */
export const COVER_LETTER_QUERY: string = groq`*[_type == "coverLetter" && _id == $id][0] {
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

/**
 * GROQ query that fetches a single `portfolioGallery` document by slug,
 * dereferencing each linked `portfolioPiece` (and that piece's `tags[]`),
 * and projecting `featuredImage.asset->url` to `featuredImageUrl` plus each
 * section's `image.asset->url` to `imageUrl`.
 *
 * Bind to a `slug` parameter. Use `PORTFOLIO_GALLERY_QUERY_RESULT` as the fetch result type.
 */
export const PORTFOLIO_GALLERY_QUERY: string = groq`*[_type == "portfolioGallery" && slug.current == $slug][0]{
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
