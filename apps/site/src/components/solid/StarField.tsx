import { For } from 'solid-js';

import styles from './style-modules/StarField.module.css';

export type Star = {
  cx: number;
  cy: number;
  r: number;
  opacity: number;
  duration: number;
};

function generateStars(count: number, width = 1920, height = 1080): Star[] {
  return Array.from({ length: count }, () => ({
    cx: Math.random() * width,
    cy: Math.random() * height,
    r: Math.random() * 1.5 + 0.5, // radius between 0.5 and 2
    opacity: Math.random() * 0.5 + 0.3, // 0.3 to 0.8
    duration: Math.random() * 3 + 2 // 2s to 5s twinkle
  }));
}

export default function StarField() {
  const stars = generateStars(150);

  return (
    <svg class={styles.starField} viewBox="0 0 1920 1080" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <For each={stars}>
        {(star) => (
          <circle cx={star.cx} cy={star.cy} r={star.r} fill="var(--color-secondary-light-gray)" opacity={star.opacity}>
            <animate
              attributeName="opacity"
              values={`${star.opacity};0;${star.opacity}`}
              dur={`${star.duration}s`}
              repeatCount="indefinite"
            />
          </circle>
        )}
      </For>
    </svg>
  );
}
