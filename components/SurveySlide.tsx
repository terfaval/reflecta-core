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
    scale: 0.85,
    rotateZ: d > 0 ? -5 : 5,
    opacity: 0,
    transition: {
      opacity: { duration: 0.6, ease: 'easeOut', delay: -0.15 }, // Korábbi indulás!
      scale: { duration: 0.4, ease: 'easeOut' },
      rotateZ: { duration: 0.4, ease: 'easeOut' },
    },
  }),
  center: {
    x: 0,
    scale: 1,
    rotateZ: 0,
    opacity: 1,
    transition: {
      x: { type: 'spring', stiffness: 300, damping: 30 },
      scale: { duration: 0.4, ease: 'easeOut' },
      rotateZ: { duration: 0.4, ease: 'easeOut' },
      opacity: { duration: 0.4, ease: 'easeOut' },
    },
  },
  exit: (d: number) => ({
    x: d > 0 ? '-100%' : '100%',
    scale: 0.85,
    rotateZ: d > 0 ? 5 : -5,
    opacity: 0,
    transition: {
      opacity: { duration: 0.6, ease: 'easeOut' }, // Kilépő: nincs delay, lassú elhalványulás
      scale: { duration: 0.4, ease: 'easeOut' },
      rotateZ: { duration: 0.4, ease: 'easeOut' },
    },
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