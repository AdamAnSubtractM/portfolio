import { For, type Component } from 'solid-js';
import { Tag } from './Tag';
import styles from './style-modules/TagSlider.module.css';

type Props = {
  title?: string;
  slides?: { title?: string | null; slug?: { current?: string } | null }[] | null;
};

export const TagsList: Component<Props> = ({ title, slides }) => {
  if (!slides?.length) return null;
  return (
    <div class={styles.tagsList}>
      {title && <p class={styles.title}>{title}</p>}
      <For each={slides}>
        {(slide) => (slide.slug?.current && slide.title ? <Tag slug={slide.slug.current}>{slide.title}</Tag> : null)}
      </For>
    </div>
  );
};
