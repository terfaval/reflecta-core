import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconReflectaGuide } from '@/components/icons/functions';
import styles from './FloatingFeatureToolbar.module.css';
import { FEATURE_LIST, FeatureInfo } from '@/lib/features';
import { useUserContext } from '@/contexts/UserContext';

interface FloatingFeatureToolbarProps {
  onTrigger: (prompt: string) => void;
  userColor?: string;
}

export default function FloatingFeatureToolbar({ onTrigger, userColor = 'currentColor' }: FloatingFeatureToolbarProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { userRole } = useUserContext();

  const roleOrder = ['basic', 'premium', 'admin'];
  const allowedFeatures = FEATURE_LIST.filter((f: FeatureInfo) => {
    if (!f.requiredRole) return true;
    if (!userRole) return false;
    return roleOrder.indexOf(userRole) >= roleOrder.indexOf(f.requiredRole);
  });

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
        className={styles.toggle}
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Összecsukás' : 'Funkciók megnyitása'}
      >
        {open ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
      {open && (
        <div className={styles.items}>
          {allowedFeatures.map((f) => (
            <button
              key={f.name}
              className={styles.itemButton}
              onClick={() => handleClick(f.tip)}
              aria-label={f.name}
            >
              <f.Icon width={20} height={20} />
              <span className={styles.tooltip}>{f.name}</span>
            </button>
          ))}
          <button
            className={`${styles.itemButton} ${styles.helpButton}`}
            onClick={() => {
              router.push('/feature-map');
              setOpen(false);
            }}
            aria-label="Reflecta útmutató"
          >
            <IconReflectaGuide width={20} height={20} />
            <span className={styles.tooltip}>Reflecta útmutató</span>
          </button>
        </div>
      )}
    </div>
  );
}