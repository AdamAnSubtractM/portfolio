import { defineField, defineType } from 'sanity';
import { formatDate } from '../../utils/formatDate';
import { richTextField } from '../fields/rich-text';
import { dateRangeFields } from '../fields/date-range';

export const educationType = defineType({
  type: 'document',
  name: 'education',
  title: 'Education',
  fields: [
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
    ...dateRangeFields()
  ],
  preview: {
    select: {
      title: 'title',
      startDate: 'startDate',
      endDate: 'endDate'
    },
    prepare({ title, startDate, endDate }) {
      return {
        title,
        subtitle: `${formatDate(startDate)} - ${endDate ? formatDate(endDate) : 'Present'}`
      };
    }
  }
});
