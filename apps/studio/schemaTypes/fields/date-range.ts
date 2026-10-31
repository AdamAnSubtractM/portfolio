import { defineField } from 'sanity';

type DateRangeOptions = {
  startRequired?: boolean;
  endRequired?: boolean;
  dateFormat?: string;
};

export const dateRangeFields = ({ startRequired = true, endRequired = false, dateFormat }: DateRangeOptions = {}) => [
  defineField({
    type: 'date',
    name: 'startDate',
    title: 'Start Date',
    options: dateFormat ? { dateFormat } : undefined,
    validation: startRequired ? (rule) => rule.required() : undefined
  }),
  defineField({
    type: 'date',
    name: 'endDate',
    title: 'End Date',
    options: dateFormat ? { dateFormat } : undefined,
    validation: endRequired ? (rule) => rule.required() : undefined
  })
];
