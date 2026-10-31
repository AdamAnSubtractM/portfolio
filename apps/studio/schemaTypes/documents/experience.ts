import { defineField, defineType } from 'sanity';
import { formatDate } from '../../utils/formatDate';
import { richTextField } from '../fields/rich-text';
import { dateRangeFields } from '../fields/date-range';

export const experienceType = defineType({
  type: 'document',
  name: 'experience',
  title: 'Experience',
  fields: [
    defineField({
      type: 'string',
      name: 'company',
      title: 'Company',
      validation: (rule) => rule.required()
    }),
    defineField({
      type: 'string',
      name: 'title',
      title: 'Title',
      validation: (rule) => rule.required()
    }),
    richTextField({
      name: 'description',
      title: 'Description',
      required: true
    }),
    ...dateRangeFields({ dateFormat: 'MMM YYYY' })
  ],
  preview: {
    select: {
      title: 'company',
      subtitle: 'title',
      startDate: 'startDate',
      endDate: 'endDate'
    },
    prepare({ title, subtitle, startDate, endDate }) {
      return {
        title,
        subtitle: `${subtitle} (${formatDate(startDate)} - ${endDate ? formatDate(endDate) : 'Present'})`
      };
    }
  }
});
