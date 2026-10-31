import { defineField, defineType } from 'sanity';
import { richTextField } from '../fields/rich-text';

export const coverLetterType = defineType({
  name: 'coverLetter',
  title: 'Cover Letter',
  type: 'document',
  fields: [
    defineField({
      type: 'reference',
      name: 'logo',
      title: 'Logo',
      description: 'Reference your logo',
      to: [{ type: 'logo' }]
    }),
    defineField({
      type: 'reference',
      name: 'contactInfo',
      title: 'Contact Info',
      description: 'Reference your contact information',
      to: [{ type: 'contactInfo' }],
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'jobTitle',
      title: 'Job Title',
      type: 'string',
      description: 'The title of the job you are applying for.',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'companyName',
      title: 'Company Name',
      type: 'string',
      description: 'The name of the company you are applying to.',
      validation: (rule) => rule.required()
    }),
    richTextField({
      name: 'companyAddress',
      title: 'Company Address',
      description: 'The address of the company (optional).'
    }),
    defineField({
      name: 'greeting',
      title: 'Greeting',
      type: 'string',
      description: 'Salutation (e.g., Dear Hiring Manager or specific person’s name).',
      validation: (rule) => rule.required()
    }),
    richTextField({
      name: 'openingParagraph',
      title: 'Opening Paragraph',
      description: 'Introduction and why you are excited about the role.',
      required: true
    }),
    richTextField({
      name: 'keyHighlights',
      title: 'Key Highlights',
      description: 'Key skills or achievements to highlight.'
    }),
    richTextField({
      name: 'closingParagraph',
      title: 'Closing Paragraph',
      description: 'Closing statement and call to action.',
      required: true
    }),
    defineField({
      name: 'signOff',
      title: 'Sign-Off',
      type: 'string',
      description: 'How you sign off (e.g., Sincerely, Best regards).',
      validation: (rule) => rule.required()
    })
  ],
  preview: {
    select: {
      title: 'jobTitle',
      subtitle: 'companyName'
    },
    prepare(selection) {
      const { title, subtitle } = selection;
      return {
        title: title || 'Untitled',
        subtitle: subtitle || 'No company name provided'
      };
    }
  }
});

export default coverLetterType;
