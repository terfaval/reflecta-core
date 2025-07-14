import React from 'react';

interface MemoryIconProps {
  type?: string;
  size?: number | string;
}

export default function MemoryIcon({ type, size = 12 }: MemoryIconProps) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    xmlns: 'http://www.w3.org/2000/svg',
  };

  switch (type) {
    case 'strategy':
      return (
        <svg {...commonProps}>
          <rect x="6" y="6" width="12" height="12" />
        </svg>
      );
    case 'emotion':
      return (
        <svg {...commonProps} viewBox="0 0 24 24">
          <path d="M12 21s-8-4.35-8-10a5 5 0 0 1 8-3.87A5 5 0 0 1 20 11c0 5.65-8 10-8 10z" />
        </svg>
      );
    case 'tone':
      return (
        <svg {...commonProps} viewBox="0 0 24 24">
          <polygon points="12 2 2 22 22 22 12 2" />
        </svg>
      );
    case 'theme':
    default:
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="5" />
        </svg>
      );
  }
}