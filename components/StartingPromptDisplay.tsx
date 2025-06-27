import React from 'react';
import styles from './StartingPromptDisplay.module.css';

interface StartingPromptDisplayProps {
  prompt: string;
  color?: string;
}

const StartingPromptDisplay: React.FC<StartingPromptDisplayProps> = ({ prompt, color }) => {
  if (!prompt) return null;
  return (
    <div className={styles.startingPrompt} style={{ color }}>
      {prompt}
    </div>
  );
};

export default StartingPromptDisplay;