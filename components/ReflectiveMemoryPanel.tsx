import React, { useEffect, useState } from 'react';
import styles from './ReflectiveMemoryPanel.module.css';

import { apiFetch } from 'lib/api';

interface MemoryLabel {
  id: string;
  label: string;
  type?: string;
  pivot?: boolean;
}

interface ReflectiveMemoryPanelProps {
  sessionId: string | null;
  handleSend: (text?: string) => void;
}

export default function ReflectiveMemoryPanel({ sessionId, handleSend }: ReflectiveMemoryPanelProps) {
  const [items, setItems] = useState<MemoryLabel[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiFetch<{ labels?: MemoryLabel[] }>(
          `/api/memory/summary?sessionId=${sessionId}`
        );
        // expecting { labels: MemoryLabel[] }
        setItems(Array.isArray(data?.labels) ? data.labels : []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch memory summary', err);
        setError('Nem sikerült betölteni a memóriát.');
      }
      setLoading(false);
    };
    load();
  }, [sessionId]);

  const reconnect = (label: string) => {
    const msg = `Múltkor már meséltem neked ${label} témáról, most szeretnék erről tovább beszélni.`;
    handleSend(msg);
  };

  const labelIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="5" />
    </svg>
  );

  const strategyIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="6" width="12" height="12" />
    </svg>
  );

  return (
    <div className={styles.panel}>
      {loading && !error && <p className={styles.loading}>Töltés...</p>}
      {items.map((item) => (
        <div key={item.id} className={`${styles.item} ${item.pivot ? styles.pivot : ''}`}>
          <div className={styles.iconWrapper} aria-label={item.label}>
            {item.type === 'strategy' ? strategyIcon : labelIcon}
            <span className={styles.tooltip}>{item.label}</span>
          </div>
          <button className={styles.reopen} onClick={() => reconnect(item.label)} aria-label="Újranyitás">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      ))}
      {error && <p className={styles.error}>{error}</p>} 
    </div>
  );
}