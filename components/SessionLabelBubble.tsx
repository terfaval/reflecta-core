// File: components/SessionLabelBubble.tsx

import { useState } from 'react';

interface SessionLabelBubbleProps {
  initialLabel: string;
  sessionId: string;
}

export default function SessionLabelBubble({ initialLabel, sessionId }: SessionLabelBubbleProps) {
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
      body: JSON.stringify({ sessionId, newLabel: tempLabel })
    });

    if (res.ok) {
      setLabel(tempLabel);
      setEditing(false);
    }

    setLoading(false);
  };

  return (
    <div className="reflecta-label-bubble">
      {editing ? (
        <div className="reflecta-label-content">
          <input
            type="text"
            value={tempLabel}
            onChange={(e) => setTempLabel(e.target.value)}
            className="reflecta-label-edit"
          />
          <button onClick={handleSave} disabled={loading} className="reflecta-label-save" aria-label="Mentés">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="reflecta-label-content">
          <span><strong>Szakasz lezárása:</strong> {label}</span>
          <button
            onClick={() => setEditing(true)}
            className="reflecta-label-edit-icon"
            aria-label="Szerkesztés"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
