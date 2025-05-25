import React from 'react';
import styles from './ScrollToBottomButton.module.css';

interface ScrollToBottomButtonProps {
  onClick: () => void;
  color: string; // ai-color
}

const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({ onClick, color }) => (
  <button
    className={styles.scrollButton}
    onClick={onClick}
    aria-label="Görgess az aljára"
    style={{
      borderColor: color,
      color: color,
    }}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </button>
);

export default ScrollToBottomButton;
