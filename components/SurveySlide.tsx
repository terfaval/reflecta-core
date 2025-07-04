import React from 'react';
import styles from './SurveySlide.module.css';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface SurveySlideProps {
  question: string;
  instruction: string;
  value: string;
  progress: number;
  isLast: boolean;
  onChange: (v: string) => void;
  onNext?: () => void;
  onBack?: () => void;
  bgColor?: string;
}

export default function SurveySlide({
  question,
  instruction,
  value,
  progress,
  isLast,
  onChange,
  onNext,
  onBack,
  bgColor,
}: SurveySlideProps) {
  return (
    <motion.div
      className={styles.slide}
      style={{ '--bg-color': bgColor } as React.CSSProperties}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className={styles.question}>{question}</h2>
      <p className={styles.instruction}>{instruction}</p>
      <textarea
        className={styles.textarea}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <div className={styles.controls}>
        {onBack ? (
          <button className={styles.navButton} onClick={onBack} aria-label="Előző kérdés">
            <ArrowLeft size={20} />
          </button>
          ) : (
          <div className={styles.placeholder} />
        )}
        <div className={styles.progressBar} aria-hidden="true">
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        {onNext && (
          <button
            className={styles.navButton}
            onClick={onNext}
            aria-label={isLast ? 'Generálás' : 'Következő kérdés'}
          >
            {isLast ? 'Generálás' : <ArrowRight size={20} />}
          </button>
        )}
      </div>
    </motion.div>
  );
}