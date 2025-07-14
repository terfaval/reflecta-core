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
    case 'emotion':
      {
        const lower = label?.toLowerCase() || '';
        if (lower.includes('sad')) {
          return (
            <svg {...commonProps} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
              <circle cx="9" cy="10" r="1" fill="currentColor" />
              <circle cx="15" cy="10" r="1" fill="currentColor" />
              <path d="M8 16c1.5-2 4.5-2 8 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          );
        }
        if (lower.includes('calm')) {
          return (
            <svg {...commonProps} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
              <circle cx="9" cy="10" r="1" fill="currentColor" />
              <circle cx="15" cy="10" r="1" fill="currentColor" />
              <line x1="8" y1="16" x2="16" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          );
        }
        if (lower.includes('happy')) {
          return (
            <svg {...commonProps} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
              <circle cx="9" cy="10" r="1" fill="currentColor" />
              <circle cx="15" cy="10" r="1" fill="currentColor" />
              <path d="M8 14c1.5 2 4.5 2 8 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          );
        }
        if (lower.includes('anxious')) {
          return (
            <svg {...commonProps} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
              <circle cx="9" cy="10" r="1" fill="currentColor" />
              <circle cx="15" cy="10" r="1" fill="currentColor" />
              <path d="M8 16c1.5-1 4.5-1 8 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          );
        }
        if (lower.includes('angry')) {
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
        return (
          <svg {...commonProps} viewBox="0 0 24 24">
            <path d="M12 21s-8-4.35-8-10a5 5 0 0 1 8-3.87A5 5 0 0 1 20 11c0 5.65-8 10-8 10z" />
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