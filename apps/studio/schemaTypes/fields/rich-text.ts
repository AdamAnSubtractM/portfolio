import { defineArrayMember, defineField } from 'sanity';

type RichTextOptions = {
  name: string;
  title: string;
  description?: string;
  required?: boolean;
};

export const richTextField = ({ name, title, description, required = false }: RichTextOptions) =>
  defineField({
    name,
    title,
    description,
    type: 'array',
    of: [defineArrayMember({ type: 'block' })],
    validation: required ? (rule) => rule.required() : undefined
  });
