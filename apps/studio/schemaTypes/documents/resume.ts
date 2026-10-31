import { defineField, defineType } from 'sanity';
import { richTextField } from '../fields/rich-text';

export const resumeType = defineType({
  type: 'document',
  name: 'resume',
  title: 'Resume',
  fields: [
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required()
    }),
    defineField({
      type: 'string',
      name: 'title',
      title: 'Use Case',
      validation: (rule) => rule.required()
    }),
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
    richTextField({
      name: 'highlights',
      title: 'Highlights',
      description: 'Key highlights or a summary of your professional profile',
      required: true
    }),
    defineField({
      type: 'array',
      name: 'experience',
      title: 'Experience',
      description: 'Reference your professional experiences',
      of: [{ type: 'reference', to: [{ type: 'experience' }] }]
    }),
    defineField({
      type: 'array',
      name: 'education',
      title: 'Education',
      description: 'Reference your professional education',
      of: [{ type: 'reference', to: [{ type: 'education' }] }]
    }),
    defineField({
      type: 'boolean',
      name: 'educationEnabled',
      title: 'Enable Education Section',
      description: 'Toggle to show or hide the education section on your resume',
      initialValue: false
    }),
    defineField({
      type: 'array',
      name: 'skills',
      title: 'Skills',
      description: 'Reference your skills section',
      of: [{ type: 'reference', to: [{ type: 'skills' }] }]
    })
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'slug.current',
      media: 'logo.svg.asset'
    }
  }
});
