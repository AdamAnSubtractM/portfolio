import { splitProps } from 'solid-js';
import type { Component, JSX } from 'solid-js';

import styles from './style-modules/Button.module.css';

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'secondary-alternate';
  href?: string;
  onClick?: (e: MouseEvent) => void;
} & JSX.HTMLAttributes<HTMLButtonElement> &
  JSX.AnchorHTMLAttributes<HTMLAnchorElement>;

const Button: Component<ButtonProps> = (props) => {
  // Destructure our known props and gather the rest
  const [local, others] = splitProps(props, ['variant', 'href', 'onClick', 'children']);

  // Ensure the component doesn't receive both href and onClick
  if (local.href && local.onClick) {
    throw new Error('Button cannot have both href and onClick.');
  }

  // Default to primary variant if none provided
  const variant = local.variant || 'primary';
  const classNames =
    !local.href && !local.onClick
      ? `${styles.base} ${styles[variant]} ${styles[`${variant}--disabled`]}`
      : `${styles.base} ${styles[variant]}`;

  // Render as an anchor if href is provided, otherwise as a button
  if (local.onClick) {
    return (
      <button {...others} type="button" onClick={local.onClick} class={classNames}>
        {local.children}
      </button>
    );
  } else {
    return (
      <a {...others} href={local.href} class={`button ${classNames}`}>
        {local.children}
      </a>
    );
  }
};

export default Button;
