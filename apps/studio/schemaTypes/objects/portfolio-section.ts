import { defineField, defineType } from 'sanity';
import { richTextField } from '../fields/rich-text';

export const portfolioSectionType = defineType({
  name: 'portfolioSection',
  title: 'Portfolio Section',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      title: 'Section Heading',
      type: 'string',
      validation: (rule) => rule.required()
    }),
    richTextField({
      name: 'description',
      title: 'Section Description',
      required: true
    }),
    defineField({
      name: 'image',
      title: 'Section Image',
      type: 'image',
      options: { hotspot: true }
    })
  ],
  preview: {
    select: {
      title: 'heading',
      media: 'image'
    }
  }
});
