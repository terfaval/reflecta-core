import React from 'react';
import styles from './ResponseTweakButtons.module.css';

interface ResponseTweakButtonsProps {
  onTweak: (promptText: string) => void;
  disabled?: boolean;
  loading?: boolean;
  userColor?: string;
}

type Tweak = {
  label: string;
  prompt: string;
  icon: React.ReactNode;
};

const tweaks: Tweak[] = [
  {
    label: 'Legyen tömörebb',
    prompt: 'Fogalmazd meg tömörebben az előző válaszodat.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 8h16" />
        <path d="M4 12h10" />
        <path d="M4 16h6" />
      </svg>
    ),
  },
  {
    label: 'Fejtsd ki jobban',
    prompt: 'Fejtsd ki jobban az előző válaszodat.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 8h6" />
        <path d="M4 12h12" />
        <path d="M4 16h16" />
      </svg>
    ),
  },
  {
    label: 'Egyszerűbben',
    prompt: 'Mondd el egyszerűbben, közérthetőbben az előző válaszodat.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 12h16" />
      </svg>
    ),
  },
  {
    label: 'Más szemszögből',
    prompt: 'Fogalmazd meg más nézőpontból is az előzőt.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    ),
  },
  {
    label: 'Menjünk mélyebbre',
    prompt: 'Segíts mélyebbre menni ebben a témában.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 5v14" />
        <polyline points="5 12 12 19 19 12" />
      </svg>
    ),
  },
];

export default function ResponseTweakButtons({
  onTweak,
  disabled = false,
  loading = false,
  userColor = 'currentColor',
}: ResponseTweakButtonsProps) {
  return (
    <div
      className={styles.tweakButtons}
      style={{
        '--user-color': userColor,
      } as React.CSSProperties}
    >
      {tweaks.map((t) => (
        <button
          key={t.label}
          className={styles.tweakButton}
          onClick={() => onTweak(t.prompt)}
          disabled={disabled || loading}
          aria-label={t.label}
        >
          {React.isValidElement(t.icon)
            ? React.cloneElement(t.icon as React.ReactElement<any>, {
                stroke: userColor,
              })
            : t.icon}
          <span className={styles.tweakLabel}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}
