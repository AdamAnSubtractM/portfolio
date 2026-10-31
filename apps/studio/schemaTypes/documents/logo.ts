import { defineField, defineType } from 'sanity';

export const logoType = defineType({
  type: 'document',
  name: 'logo',
  title: 'Logo',
  fields: [
    defineField({
      name: 'svg',
      title: 'SVG Logo',
      description: 'Upload your logo in SVG format',
      type: 'file',
      options: {
        accept: '.svg'
      }
    }),
    defineField({
      type: 'image',
      name: 'png',
      title: 'PNG Logo',
      description: 'Upload your logo in PNG format',
      options: {
        accept: '.png' // Restrict file type to PNG
      }
    })
  ],
  validation: (rule) =>
    rule.custom((fields) => {
      if (!fields?.svg && !fields?.png) {
        return 'You must provide at least one logo (SVG or PNG)';
      }
      return true;
    }),
  preview: {
    select: {
      svg: 'svg.asset.url',
      png: 'png.asset.url'
    },
    prepare({ svg, png }) {
      return {
        title: 'Logo',
        subtitle: svg ? 'SVG Provided' : png ? 'PNG Provided' : 'No Logo Provided',
        media: png ? png : undefined
      };
    }
  }
});
