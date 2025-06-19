import React from 'react';
import styles from './SurveySuccess.module.css';
import { Sparkles } from 'lucide-react';

interface SurveySuccessProps {
  profileName: string;
  onStart: () => void;
  loading?: boolean;
}

export default function SurveySuccess({ profileName, onStart, loading = false }: SurveySuccessProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.fireworks} aria-hidden="true">
        <Sparkles size={64} />
      </div>
      <h2>Sikeresen létrehoztad a saját profilod!</h2>
      <button className={styles.startButton} onClick={onStart} disabled={loading}>
        Kezdd el a beszélgetést!
      </button>
    </div>
  );
}