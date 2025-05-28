// File: components/SessionLabelBubble.tsx

import { useState } from 'react';
import styles from './SessionLabelBubble.module.css';

interface SessionLabelBubbleProps {
  initialLabel: string;
  sessionId: string;
  userColor: string;
  aiColor: string;
}

export default function SessionLabelBubble({ initialLabel, sessionId, userColor, aiColor }: SessionLabelBubbleProps) {
  const [label, setLabel] = useState(initialLabel);
  const [editing, setEditing] = useState(false);
  const [tempLabel, setTempLabel] = useState(label);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!tempLabel.trim()) return;
    setLoading(true);

    const res = await fetch('/api/session/updateLabel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, label: tempLabel })
    });

    if (res.ok) {
      setLabel(tempLabel);
      setEditing(false);
    }

    setLoading(false);
  };

  return (
    <div className={styles.bubbleWrapper} style={{ color: userColor }}>
      <div className={styles.line} style={{ backgroundColor: userColor }} />

      <div className={styles.labelBox}>
        {editing ? (
          <>
            <input
              type="text"
              value={tempLabel}
              onChange={(e) => setTempLabel(e.target.value)}
              className={styles.input}
              style={{ borderBottomColor: userColor }}
            />
            <button
              onClick={handleSave}
              disabled={loading}
              className={styles.saveButton}
              style={{
                backgroundColor: userColor,
                color: aiColor,
              }}
              aria-label="Mentés"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          </>
        ) : (
          <>
            <span><strong>Szakasz lezárása:</strong> {label}</span>
            <button
              onClick={() => setEditing(true)}
              className={styles.editButton}
              style={{ color: userColor }}
              aria-label="Szerkesztés"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
              </svg>
            </button>
          </>
        )}
      </div>

      <div className={styles.line} style={{ backgroundColor: userColor }} />
    </div>
  );
}
