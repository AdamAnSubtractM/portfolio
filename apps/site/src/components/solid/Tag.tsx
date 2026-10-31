import type { FlowComponent, JSX } from 'solid-js';
import styles from './style-modules/Tag.module.css';

type TagProps = {
  slug: string;
  children: JSX.Element;
};

export const Tag: FlowComponent<TagProps> = (props) => {
  return (
    <span data-slug={props.slug} class={styles.tag}>
      {props.children}
    </span>
  );
};
