import React, { useEffect, useState } from 'react';
import styles from './Toast.module.css';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
  type?: 'info' | 'error';
  errorType?: 'network' | 'system' | 'ai' | 'auth';
  retryCallback?: () => Promise<void> | void;
}

export default function Toast({
  message,
  onClose,
  duration = 3000,
  type = 'info',
  errorType,
  retryCallback,
}: ToastProps) {
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (retrying) return;
    const id = setTimeout(onClose, duration);
    return () => clearTimeout(id);
  }, [duration, onClose, retrying]);

  return (
    <div
      className={`${styles.toast} ${
        type === 'error' ? styles.error : ''
      } ${errorType ? styles[errorType] : ''}`}
    >
      {errorType && (
        <span className={styles.icon} aria-hidden="true">
          {{ network: '🌐', system: '⚙️', ai: '🧠', auth: '🔐' }[errorType]}
        </span>
      )}
      <span>{message}</span>
      {retryCallback && (
        <button
          onClick={async () => {
            setRetrying(true);
            try {
              await retryCallback();
            } finally {
              setRetrying(false);
              onClose();
            }
          }}
          className={styles.retry}
          disabled={retrying}
        >
          {retrying ? 'Betöltés…' : 'Próbáld újra'}
        </button>
      )}
    </div>
  );
}