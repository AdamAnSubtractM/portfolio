import { defineField, defineType } from 'sanity';

export const socialType = defineType({
  type: 'document',
  name: 'social',
  title: 'Social',
  fields: [
    defineField({
      type: 'string',
      name: 'platform',
      title: 'Platform',
      validation: (rule) => rule.required()
    }),
    defineField({
      type: 'url',
      name: 'url',
      title: 'URL',
      validation: (rule) => rule.required().uri({ scheme: ['http', 'https'] })
    })
  ],
  preview: {
    select: {
      title: 'platform',
      subtitle: 'url'
    }
  }
});
