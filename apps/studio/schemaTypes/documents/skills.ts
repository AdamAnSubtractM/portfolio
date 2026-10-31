import { defineField, defineType } from 'sanity';
import { richTextField } from '../fields/rich-text';

export const skillsType = defineType({
  type: 'document',
  name: 'skills',
  title: 'Skills',
  fields: [
    defineField({
      type: 'string',
      name: 'title',
      title: 'Title',
      description: 'The title of this skills section (e.g., "Technical Skills")',
      validation: (rule) => rule.required()
    }),
    richTextField({
      name: 'skillsContent',
      title: 'Skills Content',
      description: 'Details or categories of skills',
      required: true
    })
  ],
  preview: {
    select: {
      title: 'title'
    },
    prepare({ title }) {
      return {
        title,
        subtitle: 'Skills section'
      };
    }
  }
});
