import { createHash } from 'node:crypto';

export type PortableTextSpan = { _type: 'span'; _key: string; text: string; marks: string[] };
export type PortableTextBlock = {
  _type: 'block';
  _key: string;
  style: 'normal';
  markDefs: never[];
  children: PortableTextSpan[];
  listItem?: 'bullet';
  level?: number;
};

// Keys come from a hash, so the same text always gives the same keys and a re-run changes nothing.
export const stableKey = (...parts: (string | number)[]): string =>
  createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 12);

const BULLET = /^[-•]\s+/;

// "a **b** c" becomes three spans. The middle span has the `strong` mark.
function toSpans(text: string, blockKey: string): PortableTextSpan[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter((part) => part.length > 0)
    .map((part, index) => {
      const bold = part.length > 4 && part.startsWith('**') && part.endsWith('**');
      return {
        _type: 'span',
        _key: stableKey(blockKey, index, part),
        text: bold ? part.slice(2, -2) : part,
        marks: bold ? ['strong'] : []
      };
    });
}

// One string is one block. A string that starts with "- " is a bullet. Use **text** for bold.
export function toBlocks(lines: string | string[]): PortableTextBlock[] {
  const list = (Array.isArray(lines) ? lines : [lines]).map((line) => line.trim()).filter((line) => line.length > 0);
  return list.map((line, index) => {
    const bullet = BULLET.test(line);
    const text = bullet ? line.replace(BULLET, '') : line;
    const key = stableKey('block', index, text);
    const block: PortableTextBlock = {
      _type: 'block',
      _key: key,
      style: 'normal',
      markDefs: [],
      children: toSpans(text, key)
    };
    if (bullet) {
      block.listItem = 'bullet';
      block.level = 1;
    }
    return block;
  });
}
