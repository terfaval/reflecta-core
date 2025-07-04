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
  direction?: number;
}

const variants = {
  enter: (d: number) => ({
    x: d > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (d: number) => ({
    x: d > 0 ? '-100%' : '100%',
    opacity: 0,
  }),
};

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
  direction = 1,
}: SurveySlideProps) {
  return (
    <motion.div
      className={styles.slide}
      style={{ '--bg-color': bgColor } as React.CSSProperties}
      variants={variants}
      custom={direction}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.5, ease: 'easeInOut' }}
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
        {!isLast && (
          <div className={styles.progressBar} aria-hidden="true">
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        )}
        {onNext && (
          <button
            className={isLast ? styles.generateButton : styles.navButton}
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