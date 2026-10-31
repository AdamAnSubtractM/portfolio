import { stableKey, toBlocks, type PortableTextBlock } from './portable-text';

export type Reference = { _type: 'reference'; _ref: string; _key?: string };
export type SanityDocument = { _id: string; _type: string; [field: string]: unknown };

// The parts of the base resume that a variant copies.
export type BaseResume = {
  contactInfo?: Reference;
  logo?: Reference;
  educationEnabled?: boolean;
  experience?: Reference[];
  education?: Reference[];
  skills?: Reference[];
};

export type ExperienceSource = { company: string; title: string; startDate: string; endDate?: string };

// `ref` reuses a document. `from` copies company, title, and dates from a document and sets a new description.
export type ExperienceInput =
  | { ref: string }
  | { from: string; description: string[] }
  | { company: string; title: string; startDate: string; endDate?: string; description: string[] };

export type SkillsInput = { ref: string } | { title: string; skillsContent: string[] };

export type ResumeInput = {
  title: string;
  highlights: string[];
  experience?: ExperienceInput[];
  skills?: SkillsInput[];
  educationEnabled?: boolean;
};

export type CoverLetterInput = {
  id: string;
  jobTitle: string;
  companyName: string;
  greeting: string;
  signOff: string;
  companyAddress?: string[];
  openingParagraph: string[];
  keyHighlights?: string[];
  closingParagraph: string[];
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const isSlug = (value: string): boolean => SLUG.test(value);

const reference = (id: string, index: number, scope: string): Reference => ({
  _type: 'reference',
  _ref: id,
  _key: stableKey(scope, index, id)
});

const withKeys = (refs: Reference[] | undefined, scope: string): Reference[] | undefined =>
  refs?.map((ref, index) => reference(ref._ref, index, scope));

function requireText(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`"${name}" must be a non-empty string.`);
  return value;
}

function requireLines(value: unknown, name: string): string[] {
  if (!Array.isArray(value) || value.length === 0 || value.some((line) => typeof line !== 'string')) {
    throw new Error(`"${name}" must be a non-empty array of strings.`);
  }
  return value as string[];
}

function requireDate(value: unknown, name: string): string {
  const text = requireText(value, name);
  if (!DATE.test(text)) throw new Error(`"${name}" must look like 2024-03-01.`);
  return text;
}

// The ids of the existing experience documents that the input copies with `from`.
export function experienceSourceIds(input: ResumeInput): string[] {
  return (input.experience ?? []).flatMap((item) => ('from' in item ? [item.from] : []));
}

export function buildResume(
  slug: string,
  input: ResumeInput,
  base: BaseResume,
  sources: Record<string, ExperienceSource>
): SanityDocument[] {
  if (!isSlug(slug)) throw new Error(`The slug "${slug}" must use lowercase letters, numbers, and hyphens.`);
  const title = requireText(input.title, 'title');
  const highlights = requireLines(input.highlights, 'highlights');

  const docs: SanityDocument[] = [];
  const experienceRefs: Reference[] = [];

  (input.experience ?? []).forEach((item, index) => {
    if ('ref' in item) {
      experienceRefs.push(reference(requireText(item.ref, `experience[${index}].ref`), index, `${slug}-experience`));
      return;
    }
    const fields =
      'from' in item
        ? (() => {
            const source = sources[item.from];
            if (!source) throw new Error(`experience[${index}].from "${item.from}" was not found in Sanity.`);
            return source;
          })()
        : {
            company: requireText(item.company, `experience[${index}].company`),
            title: requireText(item.title, `experience[${index}].title`),
            startDate: requireDate(item.startDate, `experience[${index}].startDate`),
            endDate: item.endDate === undefined ? undefined : requireDate(item.endDate, `experience[${index}].endDate`)
          };
    const id = `experience-${slug}-${index + 1}`;
    docs.push({
      _id: id,
      _type: 'experience',
      company: fields.company,
      title: fields.title,
      startDate: fields.startDate,
      ...(fields.endDate ? { endDate: fields.endDate } : {}),
      description: toBlocks(requireLines(item.description, `experience[${index}].description`))
    });
    experienceRefs.push(reference(id, index, `${slug}-experience`));
  });

  const skillsRefs: Reference[] = [];
  (input.skills ?? []).forEach((item, index) => {
    if ('ref' in item) {
      skillsRefs.push(reference(requireText(item.ref, `skills[${index}].ref`), index, `${slug}-skills`));
      return;
    }
    const id = `skills-${slug}-${index + 1}`;
    docs.push({
      _id: id,
      _type: 'skills',
      title: requireText(item.title, `skills[${index}].title`),
      skillsContent: toBlocks(requireLines(item.skillsContent, `skills[${index}].skillsContent`))
    });
    skillsRefs.push(reference(id, index, `${slug}-skills`));
  });

  const resume: SanityDocument = {
    _id: `resume-${slug}`,
    _type: 'resume',
    slug: { _type: 'slug', current: slug },
    title,
    contactInfo: base.contactInfo,
    logo: base.logo,
    highlights: toBlocks(highlights) satisfies PortableTextBlock[],
    experience: input.experience ? experienceRefs : withKeys(base.experience, `${slug}-experience`),
    education: withKeys(base.education, `${slug}-education`),
    educationEnabled: input.educationEnabled ?? base.educationEnabled ?? false,
    skills: input.skills ? skillsRefs : withKeys(base.skills, `${slug}-skills`)
  };
  // Sanity rejects `undefined` fields. Drop them.
  docs.push(Object.fromEntries(Object.entries(resume).filter(([, value]) => value !== undefined)) as SanityDocument);
  return docs;
}

export function buildCoverLetter(
  input: CoverLetterInput,
  base: Pick<BaseResume, 'contactInfo' | 'logo'>
): SanityDocument {
  const id = requireText(input.id, 'id');
  if (!isSlug(id)) throw new Error(`The id "${id}" must use lowercase letters, numbers, and hyphens.`);
  const letter: SanityDocument = {
    _id: `cover-letter-${id}`,
    _type: 'coverLetter',
    contactInfo: base.contactInfo,
    logo: base.logo,
    jobTitle: requireText(input.jobTitle, 'jobTitle'),
    companyName: requireText(input.companyName, 'companyName'),
    greeting: requireText(input.greeting, 'greeting'),
    signOff: requireText(input.signOff, 'signOff'),
    companyAddress: input.companyAddress ? toBlocks(input.companyAddress) : undefined,
    openingParagraph: toBlocks(requireLines(input.openingParagraph, 'openingParagraph')),
    keyHighlights: input.keyHighlights ? toBlocks(input.keyHighlights) : undefined,
    closingParagraph: toBlocks(requireLines(input.closingParagraph, 'closingParagraph'))
  };
  return Object.fromEntries(Object.entries(letter).filter(([, value]) => value !== undefined)) as SanityDocument;
}

// Without --publish, every document is a draft. A reference still points at the published id.
export const asDraft = (doc: SanityDocument): SanityDocument => ({ ...doc, _id: `drafts.${doc._id}` });
