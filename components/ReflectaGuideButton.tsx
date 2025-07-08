import React from 'react';
import { useRouter } from 'next/router';
import { IconReflectaGuide } from '@/components/icons/functions';
import styles from './ReflectaGuideButton.module.css';

interface ReflectaGuideButtonProps {
  userColor?: string;
}

export default function ReflectaGuideButton({ userColor = 'currentColor' }: ReflectaGuideButtonProps) {
  const router = useRouter();

  return (
    <div
      className={styles.container}
      style={{ '--user-color': userColor } as React.CSSProperties}
    >
      <button
        className={styles.button}
        aria-label="Reflecta útmutató"
        onClick={() => router.push('/feature-map')}
      >
        <IconReflectaGuide width={20} height={20} />
        <span className={styles.tooltip}>Reflecta útmutató</span>
      </button>
    </div>
  );
}