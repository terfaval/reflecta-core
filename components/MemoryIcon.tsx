import React from 'react';

interface MemoryIconProps {
  type?: string;
  label?: string;
  size?: number | string;
}

export default function MemoryIcon({ type, label, size = 12 }: MemoryIconProps) {
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
    case 'emotion': {
      const lower = label?.toLowerCase() || '';
      if (lower.includes('szorong') || lower.includes('aggód')) {
        return (
          <svg {...commonProps} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="9" cy="10" r="1" fill="currentColor" />
            <circle cx="15" cy="10" r="1" fill="currentColor" />
            <path d="M8 16c1.5-1 4.5-1 8 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        );
      }
      if (lower.includes('harag') || lower.includes('düh')) {
        return (
          <svg {...commonProps} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M8 8l2 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M16 8l-2 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="9" cy="10" r="1" fill="currentColor" />
            <circle cx="15" cy="10" r="1" fill="currentColor" />
            <path d="M8 16c1.5-2 4.5-2 8 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        );
      }
      if (lower.includes('szomor')) {
        return (
          <svg {...commonProps} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="9" cy="10" r="1" fill="currentColor" />
            <circle cx="15" cy="10" r="1" fill="currentColor" />
            <path d="M8 16c1.5-2 4.5-2 8 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        );
      }
      if (lower.includes('boldog') || lower.includes('öröm')) {
        return (
          <svg {...commonProps} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="9" cy="10" r="1" fill="currentColor" />
            <circle cx="15" cy="10" r="1" fill="currentColor" />
            <path d="M8 14c1.5 2 4.5 2 8 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        );
      }
      if (lower.includes('nyugodt') || lower.includes('békés')) {
        return (
          <svg {...commonProps} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="9" cy="10" r="1" fill="currentColor" />
            <circle cx="15" cy="10" r="1" fill="currentColor" />
            <line x1="8" y1="16" x2="16" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      }
      if (lower.includes('remény')) {
        return (
          <svg {...commonProps} viewBox="0 0 24 24">
            <path d="M12 2v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="M20 12h2" />
            <path d="m19.07 4.93-1.41 1.41" />
            <path d="M15.947 12.65a4 4 0 0 0-5.925-4.128" />
            <path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" />
          </svg>
        );
      }
      return (
        <svg {...commonProps} viewBox="0 0 24 24">
          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
          <path d="M8 15h.01" />
          <path d="M8 19h.01" />
          <path d="M12 17h.01" />
          <path d="M12 21h.01" />
          <path d="M16 15h.01" />
          <path d="M16 19h.01" />
        </svg>
      );
    }
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