import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import styles from './FloatingFeatureToolbar.module.css';
import { FEATURE_LIST } from '@/lib/features';

interface FloatingFeatureToolbarProps {
  onTrigger: (prompt: string) => void;
  userColor?: string;
}

export default function FloatingFeatureToolbar({ onTrigger, userColor = 'currentColor' }: FloatingFeatureToolbarProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleClick = (tip: string) => {
    onTrigger(tip);
    setOpen(false);
  };

  return (
    <div
      className={styles.toolbar}
      style={{ '--user-color': userColor } as React.CSSProperties}
    >
      <button
        className={styles.button}
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Összecsukás' : 'Funkciók megnyitása'}
      >
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div className={styles.items}>
          {FEATURE_LIST.map((f) => (
            <button
              key={f.name}
              className={styles.button}
              onClick={() => handleClick(f.tip)}
              aria-label={f.name}
            >
              <f.Icon />
              <span className={styles.tooltip}>{f.name}</span>
            </button>
          ))}
          <button
            className={styles.button}
            onClick={() => {
              router.push('/feature-map');
              setOpen(false);
            }}
            aria-label="Reflecta útmutató"
          >
            <HelpCircle size={14} />
            <span className={styles.tooltip}>Reflecta útmutató</span>
          </button>
        </div>
      )}
    </div>
  );
}