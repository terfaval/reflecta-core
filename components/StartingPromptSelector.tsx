// components/StartingPromptSelector.tsx

import React from 'react';
import styles from './StartingPromptSelector.module.css';

interface Prompt {
  label: string;
  message: string;
}

interface StartingPromptSelectorProps {
  prompts: Prompt[];
  onSelectPrompt: (message: string) => void;
  aiColor?: string;
  userColor?: string;
}

const StartingPromptSelector: React.FC<StartingPromptSelectorProps> = ({
  prompts,
  onSelectPrompt,
  aiColor = '#f7f7f7',
  userColor = '#222'
}) => {
  if (!prompts || prompts.length === 0) return null;

  return (
    <div className={styles.reflectaStartingPrompts}>
      {prompts.map((prompt, index) => (
        <button
          key={index}
          className={styles.reflectaStartingBox}
          style={{
            backgroundColor: aiColor,
            color: userColor,
          }}
          onClick={() => onSelectPrompt(prompt.message)}
        >
          {prompt.label}
        </button>
      ))}
    </div>
  );
};

export default StartingPromptSelector;
