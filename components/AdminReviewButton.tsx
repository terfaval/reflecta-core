import React from 'react';
import { useRouter } from 'next/router';
import { CheckCheck } from 'lucide-react';
import styles from './ReflectaGuideButton.module.css';

export default function AdminReviewButton({ userColor = 'currentColor' }: { userColor?: string }) {
  const router = useRouter();
  return (
    <div className={styles.container} style={{ '--user-color': userColor } as React.CSSProperties}>
      <button
        className={styles.button}
        aria-label="Exemplar jóváhagyás"
        onClick={() => router.push('/admin/strategy-review')}
      >
        <CheckCheck width={20} height={20} />
        <span className={styles.tooltip}>Exemplar jóváhagyás</span>
      </button>
    </div>
  );
}