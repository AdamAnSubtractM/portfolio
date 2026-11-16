import { createSignal, mergeProps, onCleanup, Show } from 'solid-js';
import type { Component } from 'solid-js';

// Hover: a gold outline at once, then a solid gold fill after SOLID_DELAY_MS.
// The symbol turns while the pointer is on the logo. On leave, the symbol
// eases back to upright by the shorter way.
const SPIN_MS = 2400;
const SOLID_DELAY_MS = 1500;
const SETTLE_MIN_MS = 300;
const SETTLE_MAX_MS = 900;
const SETTLE_MS_PER_DEG = 5;

// The angle that the element shows now, from 0 to 360.
const currentAngle = (el: Element): number => {
  const transform = getComputedStyle(el).transform;
  if (!transform || transform === 'none') return 0;
  const m = new DOMMatrixReadOnly(transform);
  return ((Math.atan2(m.b, m.a) * 180) / Math.PI + 360) % 360;
};

// Stop the running animations, but keep the angle that they show now.
const freeze = (el: Element): number => {
  const angle = currentAngle(el);
  el.getAnimations().forEach((animation) => animation.cancel());
  return angle;
};

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const Logo: Component<{ isLink?: boolean; styles: CSSModuleClasses }> = (props) => {
  const mergedProps = mergeProps({ isLink: true }, props);
  const [isActive, setIsActive] = createSignal(false);
  const [isSolid, setIsSolid] = createSignal(false);
  // oxlint-disable-next-line no-unassigned-vars -- assigned by Solid via `ref={markRef}`
  let markRef: SVGGElement | undefined;
  let solidTimer: ReturnType<typeof setTimeout> | undefined;

  const activate = () => {
    if (isActive()) return;
    setIsActive(true);
    solidTimer = setTimeout(() => setIsSolid(true), SOLID_DELAY_MS);
    if (!markRef || prefersReducedMotion()) return;
    const from = freeze(markRef);
    markRef.animate([{ transform: `rotate(${from}deg)` }, { transform: `rotate(${from + 360}deg)` }], {
      duration: SPIN_MS,
      iterations: Infinity,
      easing: 'linear'
    });
  };

  const deactivate = () => {
    if (!isActive()) return;
    setIsActive(false);
    setIsSolid(false);
    clearTimeout(solidTimer);
    if (!markRef) return;
    const from = freeze(markRef);
    if (from < 0.5 || from > 359.5) return;
    // Past halfway, continue forward and slow down. Before halfway, turn back.
    const forward = from >= 180;
    const to = forward ? 360 : 0;
    markRef.animate([{ transform: `rotate(${from}deg)` }, { transform: `rotate(${to}deg)` }], {
      duration: Math.min(SETTLE_MAX_MS, Math.max(SETTLE_MIN_MS, Math.abs(to - from) * SETTLE_MS_PER_DEG)),
      easing: forward ? 'cubic-bezier(0.33, 1, 0.68, 1)' : 'cubic-bezier(0.65, 0, 0.35, 1)'
    });
  };

  onCleanup(() => {
    clearTimeout(solidTimer);
    markRef?.getAnimations().forEach((animation) => animation.cancel());
  });

  // Touch has no hover. A tap on the logo goes to the home page.
  const onPointerEnter = (e: PointerEvent) => {
    if (e.pointerType !== 'touch') activate();
  };
  const onPointerLeave = (e: PointerEvent) => {
    if (e.pointerType !== 'touch') deactivate();
  };

  const svg = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill-rule="evenodd"
      stroke-linejoin="round"
      stroke-miterlimit="2"
      clip-rule="evenodd"
      viewBox="0 0 1818 349"
      aria-hidden="true"
    >
      <g class={mergedProps.styles.mark} ref={markRef}>
        <path
          pathLength="1"
          d="M235.056 115.707c84.535 85.069 128.424 181.473 96.072 213.824-32.389 32.389-128.975-11.635-214.12-96.366 12.099 11.99 27.858 20.293 45.451 23.086 60.567 48.856 120.344 71.432 143.047 48.729 22.702-22.703 1.199-83.548-47.656-144.114-2.769-17.452-10.961-33.099-22.794-45.159Zm-.879-.883-.426-.427C148.347 28.993 52.752-13.88 20.235 18.637-12.283 51.155 30.59 146.75 115.994 232.154l.722.721c-12.024-12.033-20.384-27.728-23.263-45.268C43.488 126.376 21.825 66.114 44.768 43.171c22.942-22.942 83.203-1.28 144.432 48.683 17.399 2.855 32.982 11.102 44.977 22.97Z"
        />
        <circle pathLength="1" cx="55.183" cy="294.451" r="35.686" />
        <circle pathLength="1" cx="294.267" cy="55.367" r="35.686" />
        <path
          pathLength="1"
          d="M175.616 340.552c91.974 0 166.534-74.56 166.534-166.534 0-91.974-74.56-166.533-166.534-166.533-91.974 0-166.533 74.559-166.533 166.533 0 91.974 74.559 166.534 166.533 166.534Zm0-83.267c31.283 0 58.537-17.251 72.767-42.76 6.689-11.989 10.5-25.803 10.5-40.507 0-45.987-37.28-83.266-83.267-83.266-45.987 0-83.266 37.279-83.266 83.266s37.279 83.267 83.266 83.267Z"
        />
        <circle pathLength="1" cx="175.616" cy="174.018" r="35.686" />
      </g>
      <g class={mergedProps.styles.word}>
        <path
          pathLength="1"
          fill-rule="nonzero"
          d="m579.064 334.841-79.365-128.468v128.468H372.943V12.443l126.756.112v120.733l80.507-120.475h147.31L607.041 174.969l123.33 159.872H579.064ZM984.333 10.529c36.917 0 65.657 12.372 86.207 37.114 20.94 24.742 31.41 58.239 31.41 100.491v186.707H975.763v-170.72c0-15.226-4.19-27.217-12.56-35.971-7.99-9.136-18.84-13.704-32.55-13.704-14.08 0-25.119 4.568-33.112 13.704-7.994 8.754-11.991 20.745-11.991 35.971v170.72H758.795V12.813H885.55v49.104c9.897-15.226 23.03-27.597 39.393-37.113 16.75-9.517 36.55-14.275 59.39-14.275Zm472.907 160.443c0 8.755-.57 17.129-1.71 25.123h-203.84c1.9 27.787 13.51 41.681 34.83 41.681 13.7 0 23.6-6.281 29.69-18.842h134.18c-4.57 22.839-14.27 43.394-29.12 61.665-14.46 17.89-32.93 32.165-55.38 42.823-22.08 10.277-46.44 15.416-73.09 15.416-31.97 0-60.52-6.662-85.64-19.984-24.75-13.323-44.16-32.355-58.24-57.097-13.71-25.123-20.56-54.433-20.56-87.93 0-33.497 6.85-62.616 20.56-87.358 14.08-25.123 33.49-44.346 58.24-57.668 25.12-13.323 53.67-19.985 85.64-19.985 31.98 0 60.33 6.662 85.08 19.984 25.12 12.942 44.53 31.594 58.24 55.956 14.08 24.361 21.12 53.1 21.12 86.216Zm-128.47-30.261c0-10.658-3.42-18.652-10.27-23.981-6.86-5.71-15.42-8.564-25.7-8.564-22.46 0-35.59 10.848-39.4 32.545h75.37Zm480.31 30.261c0 8.755-.57 17.129-1.71 25.123h-203.84c1.9 27.787 13.51 41.681 34.83 41.681 13.7 0 23.6-6.281 29.69-18.842h134.18c-4.57 22.839-14.28 43.394-29.12 61.665-14.47 17.89-32.93 32.165-55.39 42.823-22.07 10.277-46.43 15.416-73.08 15.416-31.97 0-60.52-6.662-85.65-19.984-24.74-13.323-44.15-32.355-58.23-57.097-13.71-25.123-20.56-54.433-20.56-87.93 0-33.497 6.85-62.616 20.56-87.358 14.08-25.123 33.49-44.346 58.23-57.668 25.13-13.323 53.68-19.985 85.65-19.985 31.97 0 60.33 6.662 85.07 19.984 25.13 12.942 44.54 31.594 58.24 55.956 14.09 24.361 21.13 53.1 21.13 86.216Zm-128.47-30.261c0-10.658-3.42-18.652-10.28-23.981-6.85-5.71-15.41-8.564-25.69-8.564-22.46 0-35.59 10.848-39.4 32.545h75.37Z"
        />
      </g>
    </svg>
  );
  return (
    <div class={mergedProps.styles.logo}>
      <Show when={mergedProps.isLink} fallback={svg}>
        <a
          href="/"
          title="View Adam's home page"
          classList={{
            [mergedProps.styles.active]: isActive(),
            [mergedProps.styles.solid]: isSolid()
          }}
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
          onFocus={activate}
          onBlur={deactivate}
        >
          {svg}
        </a>
      </Show>
    </div>
  );
};

export default Logo;
