import { mergeProps, onCleanup, onMount } from 'solid-js';
import Button from './Button';
import type { Component } from 'solid-js';

type PrintResumeButtonProps = {
  ctaText?: string;
  resumeURI?: string;
  slug?: string;
};

const PrintResumeButton: Component<PrintResumeButtonProps> = (props) => {
  // If a slug is provided, use it to generate the PDF link, otherwise use the default
  const dynamicResumeURI = props.slug ? `/adam-knee-${props.slug}.pdf` : '/adam-knee-resume.pdf';
  const merged = mergeProps({ ctaText: 'Print Resume', resumeURI: dynamicResumeURI }, props);

  onMount(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      // Check if CMD (or CTRL) and "p" are pressed
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        window.open(merged.resumeURI, '_blank');
      }
    };

    // Attach the event listener when the component mounts
    document.addEventListener('keydown', handleKeyDown);

    // Clean up the event listener when the component unmounts
    onCleanup(() => {
      document.removeEventListener('keydown', handleKeyDown);
    });
  });

  return (
    <Button href={merged.resumeURI} target="_blank">
      {merged.ctaText}
    </Button>
  );
};

export default PrintResumeButton;
