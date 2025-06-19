import React from 'react';
import styles from './SurveySlide.module.css';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface SurveySlideProps {
  question: string;
  instruction: string;
  value: string;
  step: number;
  total: number;
  onChange: (v: string) => void;
  onNext?: () => void;
  onBack?: () => void;
}

export default function SurveySlide({
  question,
  instruction,
  value,
  step,
  total,
  onChange,
  onNext,
  onBack,
}: SurveySlideProps) {
  return (
    <div className={styles.slide}>
      <div className={styles.progress}>{step}/{total}</div>
      <h2 className={styles.question}>{question}</h2>
      <p className={styles.instruction}>{instruction}</p>
      <textarea
        className={styles.textarea}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <div className={styles.buttons}>
        {onBack && (
          <button className={styles.navButton} onClick={onBack} aria-label="Előző kérdés">
            <ArrowLeft size={20} />
          </button>
        )}
        {onNext && (
          <button className={styles.navButton} onClick={onNext} aria-label="Következő kérdés">
            <ArrowRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}