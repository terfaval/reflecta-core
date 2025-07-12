import React, { useEffect } from 'react';
import styles from './Toast.module.css';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
  type?: 'info' | 'error';
  retryCallback?: () => void;
}

export default function Toast({
  message,
  onClose,
  duration = 3000,
  type = 'info',
  retryCallback,
}: ToastProps) {
  useEffect(() => {
    const id = setTimeout(onClose, duration);
    return () => clearTimeout(id);
  }, [duration, onClose]);

  return (
    <div className={`${styles.toast} ${type === 'error' ? styles.error : ''}`}> 
      <span>{message}</span>
      {retryCallback && (
        <button
          onClick={() => {
            onClose();
            retryCallback();
          }}
          className={styles.retry}
        >
          Próbáld újra
        </button>
      )}
    </div>
  );
}