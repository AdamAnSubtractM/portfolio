import { toast } from 'solid-toast';
import Button from './Button';
import { mergeProps, type Component } from 'solid-js';
import CheckSVG from './CheckSVG';
import GithubSVG from './GithubSVG';
import LinkedInSVG from './LinkedInSVG';
import PatternBox from './PatternBox';

import styles from './style-modules/ContactCard.module.css';

const ContactCard: Component<{ email?: string }> = (props) => {
  const merged = mergeProps({ email: 'contact@adamknee.dev' }, props);

  const copyEmail = async () => {
    await navigator.clipboard.writeText(merged.email);
    toast.success('Email copied to clipboard', {
      icon: <CheckSVG />,
      duration: 3000,
      ariaProps: {
        role: 'alert',
        'aria-live': 'polite'
      },
      style: {
        'background-color': 'var(--color-primary-dark-purple-90)',
        border: 'var(--size-width-border-sm) solid var(--color-secondary-lavender-gray)',
        color: 'var(--color-accent-electric-blue)',
        'font-weight': 'var(--font-weight-bold)'
      }
    });
  };

  return (
    <>
      <section class={styles.contactSlip}>
        <input type="email" value={merged.email} readOnly />
        <Button onClick={copyEmail}>Copy Email</Button>
      </section>
      <section class={styles.contactSlip}>
        <a
          class="icon-button icon-button--large"
          href="https://github.com/AdamAnSubtractM"
          target="_blank"
          title="View Adam's GitHub profile"
        >
          <GithubSVG />
        </a>
        <a href="https://github.com/AdamAnSubtractM" target="_blank" title="View Adam's GitHub profile">
          Follow me on Github
        </a>
      </section>
      <section class={styles.contactSlip}>
        <a
          class="icon-button icon-button--large"
          href="https://www.linkedin.com/in/adam-knee-web-dev/"
          target="_blank"
          title="View Adam's LinkedIn profile"
        >
          <LinkedInSVG />
        </a>
        <a href="https://www.linkedin.com/in/adam-knee-web-dev/" target="_blank" title="View Adam's LinkedIn profile">
          Connect with me on LinkedIn
        </a>
      </section>
      <PatternBox />
    </>
  );
};

export default ContactCard;
