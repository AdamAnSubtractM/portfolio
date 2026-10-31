import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { createClient, type SanityClient } from '@sanity/client';
import {
  asDraft,
  buildCoverLetter,
  buildResume,
  experienceSourceIds,
  type BaseResume,
  type CoverLetterInput,
  type ExperienceSource,
  type ResumeInput,
  type SanityDocument
} from './lib/build-documents';

// Write resume variants and cover letters to Sanity.
//
//   pnpm sanity:resume <slug> <content.json> [--apply] [--publish] [--base portfolio] [--json]
//   pnpm sanity:cover-letter <content.json> [--apply] [--publish] [--base portfolio] [--json]
//
// The default is a dry run: it prints what it would write and sends nothing. --apply writes the
// documents as drafts. --apply --publish writes them as published documents.
// --apply needs SANITY_WRITE_TOKEN in apps/site/.env.

const USAGE = `Usage:
  pnpm sanity:resume <slug> <content.json> [--apply] [--publish] [--base <slug>] [--json]
  pnpm sanity:cover-letter <content.json> [--apply] [--publish] [--base <slug>] [--json]`;

const API_VERSION = '2024-11-16';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Add it to apps/site/.env.`);
  return value;
}

async function readJson<T>(path: string): Promise<T> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T;
  } catch (error) {
    throw new Error(`Cannot read JSON from ${path}: ${(error as Error).message}`);
  }
}

async function fetchBase(client: SanityClient, baseSlug: string): Promise<BaseResume> {
  const base = await client.fetch<BaseResume | null>(
    `*[_type == "resume" && slug.current == $slug][0]{contactInfo, logo, educationEnabled, experience, education, skills}`,
    { slug: baseSlug }
  );
  if (!base) throw new Error(`No published resume has the slug "${baseSlug}".`);
  return base;
}

async function fetchExperienceSources(client: SanityClient, ids: string[]): Promise<Record<string, ExperienceSource>> {
  if (ids.length === 0) return {};
  const found = await client.fetch<(ExperienceSource & { _id: string })[]>(
    `*[_type == "experience" && _id in $ids]{_id, company, title, startDate, endDate}`,
    { ids }
  );
  return Object.fromEntries(found.map(({ _id, ...fields }) => [_id, fields]));
}

function describe(doc: SanityDocument): string {
  const label = [
    doc.title,
    doc.company && `${doc.company} (${doc.title})`,
    doc.companyName && `${doc.companyName}, ${doc.jobTitle}`
  ]
    .filter(Boolean)
    .at(-1);
  return `  ${doc._type.padEnd(12)} ${doc._id}${label ? `  ${label}` : ''}`;
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      apply: { type: 'boolean', default: false },
      publish: { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
      base: { type: 'string', default: 'portfolio' }
    }
  });
  const [command, ...args] = positionals;
  const apply = values.apply === true;
  const publish = values.publish === true;
  const baseSlug = values.base ?? 'portfolio';

  if (command !== 'resume' && command !== 'cover-letter') throw new Error(`Unknown command.\n${USAGE}`);
  const [slugOrFile, maybeFile] = args;
  const file = command === 'resume' ? maybeFile : slugOrFile;
  if (!slugOrFile || !file) throw new Error(USAGE);

  const client = createClient({
    projectId: requireEnv('PUBLIC_SANITY_STUDIO_PROJECT_ID'),
    dataset: requireEnv('PUBLIC_SANITY_STUDIO_DATASET'),
    apiVersion: API_VERSION,
    useCdn: false,
    token: apply ? requireEnv('SANITY_WRITE_TOKEN') : undefined
  });

  const base = await fetchBase(client, baseSlug);
  let docs: SanityDocument[];

  if (command === 'resume') {
    const slug = slugOrFile;
    if (slug === baseSlug) throw new Error(`The slug "${slug}" is the base resume. Choose a new slug.`);
    const input = await readJson<ResumeInput>(file);
    const clash = await client.fetch<string | null>(
      `*[_type == "resume" && slug.current == $slug && !(_id in [$id, $draftId])][0]._id`,
      { slug, id: `resume-${slug}`, draftId: `drafts.resume-${slug}` }
    );
    if (clash) throw new Error(`The slug "${slug}" is already used by the document ${clash}. Choose a new slug.`);
    docs = buildResume(slug, input, base, await fetchExperienceSources(client, experienceSourceIds(input)));
  } else {
    docs = [buildCoverLetter(await readJson<CoverLetterInput>(file), base)];
  }

  const toWrite = publish ? docs : docs.map(asDraft);
  console.log(
    `${apply ? 'Writing' : 'Dry run. Would write'} ${toWrite.length} document(s) as ${publish ? 'published' : 'draft'}:`
  );
  toWrite.forEach((doc) => console.log(describe(doc)));
  if (values.json) console.log(JSON.stringify(toWrite, null, 2));

  if (!apply) {
    console.log('\nNothing was sent. Add --apply to write.');
    return;
  }

  const transaction = client.transaction();
  toWrite.forEach((doc) => transaction.createOrReplace(doc));
  const result = await transaction.commit();
  console.log(`\nDone. Transaction ${result.transactionId}.`);

  const main = docs.find((doc) => doc._type === 'resume' || doc._type === 'coverLetter');
  if (main?._type === 'resume') {
    console.log(publish ? '' : 'Open Sanity Studio, check the drafts, and publish the new documents.');
    console.log(`After you publish and deploy, the page is /resume/${(main.slug as { current: string }).current}.`);
  } else if (main) {
    console.log(`Cover letter id: ${main._id}`);
    console.log(publish ? '' : 'The route reads published documents only. Publish the letter in Sanity Studio first.');
  }
}

main().catch((error: unknown) => {
  console.error(`[sanity-write] ${(error as Error).message}`);
  process.exit(1);
});
