import type { Component } from 'solid-js';
import Button from './Button';
import styles from './style-modules/PortfolioCard.module.css';

export type PortfolioCardProps = {
  title?: string | null;
  description?: string | null;
  imageUrl: string;
  link: string;
  tags?: { title: string; slug: { _type: 'slug'; current: string } }[];
};

const PortfolioCard: Component<PortfolioCardProps> = (props) => {
  return (
    <article class={styles.portfolioCard}>
      <div class={styles.thumbnail}>
        <img src={props.imageUrl} alt={props.title ?? ''} />
      </div>
      <div class={styles.content}>
        {props.title && <h3 class={styles.title}>{props.title}</h3>}
        {props.description && <p class={styles.description}>{props.description}</p>}
        <Button variant="secondary" href={props.link}>
          Read More
        </Button>
      </div>
    </article>
  );
};

export default PortfolioCard;
