import React from 'react';
import { RotateCw } from 'lucide-react';
import styles from './UserErrorDisplay.module.css';

interface UserErrorDisplayProps {
  message: string;
  onRetry: () => void;
}

export default function UserErrorDisplay({ message, onRetry }: UserErrorDisplayProps) {
  return (
    <div className={styles.wrapper}>
      <p className={styles.message}>{message}</p>
      <button onClick={onRetry} className={styles.retryButton}>
        <RotateCw size={20} />
        <span>Próbáld újra</span>
      </button>
    </div>
  );
}