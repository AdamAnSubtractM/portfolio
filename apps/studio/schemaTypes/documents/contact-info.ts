import { defineField, defineType } from 'sanity';

export const contactInfoType = defineType({
  type: 'document',
  name: 'contactInfo',
  title: 'Contact Info',
  fields: [
    defineField({
      type: 'string',
      name: 'name',
      title: 'Name',
      validation: (rule) => rule.required()
    }),
    defineField({
      type: 'string',
      name: 'title',
      title: 'Title',
      validation: (rule) => rule.required()
    }),
    defineField({
      type: 'string',
      name: 'email',
      title: 'Email',
      validation: (rule) => rule.required().email()
    }),
    defineField({
      type: 'array',
      name: 'socials',
      title: 'Socials',
      description: 'Add links to your social profiles',
      of: [{ type: 'reference', to: [{ type: 'social' }] }]
    })
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'title'
    }
  }
});
