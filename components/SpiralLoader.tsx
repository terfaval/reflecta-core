import React from 'react';
import styles from './SpiralLoader.module.css';

interface SpiralLoaderProps {
  userColor: string;
  aiColor: string;
  fullScreen?: boolean;
}

const SpiralLoader: React.FC<SpiralLoaderProps> = ({
  userColor,
  aiColor,
  fullScreen = true,
}) => (
  <div
    className={`${styles.spiralLoader}${fullScreen ? '' : ' ' + styles.compact}`}
  >
    <svg
      viewBox="0 0 100 100"
      className={styles.spiralSvg}
      aria-label="Töltés…"
    >
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="none"
        stroke={aiColor}
        strokeWidth="4"
      />
      <path
        className={styles.spiralPath}
        d="M50,50 m0,-40 a40,40 0 1,1 -0.01,0"
        fill="none"
        stroke={userColor}
        strokeWidth="4"
        strokeLinecap="round"
        />
    </svg>
  </div>
);

export default SpiralLoader;
