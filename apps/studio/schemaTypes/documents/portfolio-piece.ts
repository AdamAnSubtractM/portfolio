import { defineField, defineArrayMember, defineType } from 'sanity';

export const portfolioPieceType = defineType({
  name: 'portfolioPiece',
  title: 'Portfolio Piece',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      options: { hotspot: true },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'tag' }]
        })
      ],
      validation: (rule) => rule.min(1).unique()
    }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      of: [defineArrayMember({ type: 'portfolioSection' })],
      validation: (rule) => rule.required().min(1)
    }),
    defineField({
      name: 'launchUrl',
      title: 'Launch URL',
      type: 'url',
      description: 'Where this project is hosted (e.g. https://…).'
    }),
    defineField({
      name: 'repoUrl',
      title: 'Repository URL',
      type: 'url',
      description: 'Link to the source code repo (e.g. GitHub).'
    })
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'description',
      media: 'featuredImage'
    }
  }
});
