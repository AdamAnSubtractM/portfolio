import type { JSX } from 'solid-js';

interface IconButtonProps {
  children: JSX.Element;
  title?: string;
  class?: string;
  disabled?: boolean;
  onClick: () => void;
}

export default function IconButton(props: IconButtonProps) {
  return (
    <button
      type="button"
      class={props?.class ? `icon-button ${props.class}` : 'icon-button'}
      title={props.title}
      onClick={props.onClick}
      disabled={props?.disabled}
    >
      {props.children}
    </button>
  );
}
