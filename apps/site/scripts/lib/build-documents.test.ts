import { describe, expect, it } from 'vitest';
import { asDraft, buildCoverLetter, buildResume, experienceSourceIds, type BaseResume } from './build-documents';
import { toBlocks } from './portable-text';

const base: BaseResume = {
  contactInfo: { _type: 'reference', _ref: 'contact-1' },
  logo: { _type: 'reference', _ref: 'logo-1' },
  educationEnabled: false,
  experience: [{ _type: 'reference', _ref: 'exp-1' }],
  education: [{ _type: 'reference', _ref: 'edu-1' }],
  skills: [{ _type: 'reference', _ref: 'skills-1' }]
};

describe('toBlocks', () => {
  it('makes bullets and bold spans', () => {
    const [bullet, paragraph] = toBlocks(['- Built **React** apps', 'Plain text']);
    expect(bullet.listItem).toBe('bullet');
    expect(bullet.children.map((span) => [span.text, span.marks])).toEqual([
      ['Built ', []],
      ['React', ['strong']],
      [' apps', []]
    ]);
    expect(paragraph.listItem).toBeUndefined();
  });

  it('gives the same keys for the same text and unique keys inside a block', () => {
    const first = toBlocks(['- **a** and **a**']);
    expect(toBlocks(['- **a** and **a**'])).toEqual(first);
    const keys = first[0].children.map((span) => span._key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('drops empty lines', () => {
    expect(toBlocks(['', '  ', 'text'])).toHaveLength(1);
  });
});

describe('buildResume', () => {
  it('copies the base references and keeps the base experience when the input has none', () => {
    const docs = buildResume('acme', { title: 'Acme', highlights: ['- one'] }, base, {});
    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({
      _id: 'resume-acme',
      _type: 'resume',
      slug: { current: 'acme' },
      contactInfo: base.contactInfo,
      educationEnabled: false
    });
    expect((docs[0].experience as { _ref: string }[]).map((ref) => ref._ref)).toEqual(['exp-1']);
  });

  it('creates an experience document from `from` and refers to it', () => {
    const input = { title: 'T', highlights: ['h'], experience: [{ from: 'exp-1', description: ['- new text'] }] };
    expect(experienceSourceIds(input)).toEqual(['exp-1']);
    const docs = buildResume('acme', input, base, {
      'exp-1': { company: 'Co', title: 'Dev', startDate: '2020-01-01' }
    });
    expect(docs.map((doc) => doc._id)).toEqual(['experience-acme-1', 'resume-acme']);
    expect(docs[0]).toMatchObject({ company: 'Co', title: 'Dev', startDate: '2020-01-01' });
    expect(docs[0]).not.toHaveProperty('endDate');
  });

  it('throws for a bad slug, a missing source, and a bad date', () => {
    expect(() => buildResume('Bad Slug', { title: 'T', highlights: ['h'] }, base, {})).toThrow(/slug/);
    expect(() =>
      buildResume('a', { title: 'T', highlights: ['h'], experience: [{ from: 'x', description: ['d'] }] }, base, {})
    ).toThrow(/not found/);
    expect(() =>
      buildResume(
        'a',
        {
          title: 'T',
          highlights: ['h'],
          experience: [{ company: 'C', title: 'T', startDate: 'Jan 2020', description: ['d'] }]
        },
        base,
        {}
      )
    ).toThrow(/startDate/);
  });

  it('never writes undefined fields', () => {
    const [doc] = buildResume('a', { title: 'T', highlights: ['h'] }, { educationEnabled: true }, {});
    expect(Object.values(doc)).not.toContain(undefined);
  });
});

describe('buildCoverLetter and asDraft', () => {
  it('builds a cover letter with the base contact info', () => {
    const letter = buildCoverLetter(
      {
        id: 'acme',
        jobTitle: 'Engineer',
        companyName: 'Acme',
        greeting: 'Dear team,',
        signOff: 'Thanks,',
        openingParagraph: ['Hello'],
        closingParagraph: ['Bye']
      },
      base
    );
    expect(letter).toMatchObject({ _id: 'cover-letter-acme', _type: 'coverLetter', contactInfo: base.contactInfo });
    expect(letter).not.toHaveProperty('keyHighlights');
  });

  it('prefixes the id with drafts. and leaves references alone', () => {
    const [doc] = buildResume('a', { title: 'T', highlights: ['h'] }, base, {});
    const draft = asDraft(doc);
    expect(draft._id).toBe('drafts.resume-a');
    expect(draft.contactInfo).toEqual(base.contactInfo);
  });
});
