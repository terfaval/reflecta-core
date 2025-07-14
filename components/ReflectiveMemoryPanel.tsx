import React, { useEffect, useState } from 'react';
import styles from './ReflectiveMemoryPanel.module.css';
import MemoryIcon from './MemoryIcon';

import { apiFetch } from 'lib/api';
import { useUserContext } from '@/contexts/UserContext';

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
  const [typeFilters, setTypeFilters] = useState<Record<string, boolean>>({});
  const { userRole } = useUserContext();

  useEffect(() => {
    if (!sessionId || userRole === 'guest') return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiFetch<{ labels?: MemoryLabel[] }>(
          `/api/memory/summary?sessionId=${sessionId}`
        );
        const newItems = Array.isArray(data?.labels) ? data.labels : [];
        setItems(newItems);
        const newTypes = Array.from(
          new Set(newItems.map((i) => i.type).filter(Boolean))
        ) as string[];
        setTypeFilters((prev) => {
          const next: Record<string, boolean> = {};
          newTypes.forEach((t) => {
            next[t] = prev[t] ?? true;
          });
          return next;
        });
        setError(null);
      } catch (err) {
        console.error('Failed to fetch memory summary', err);
        setError('Nem sikerült betölteni a memóriát.');
      }
      setLoading(false);
    };
    load();
  }, [sessionId, userRole]);

  const reconnect = (label: string) => {
    const msg = `Múltkor már meséltem neked ${label} témáról, most szeretnék erről tovább beszélni.`;
    handleSend(msg);
  };

  if (userRole === 'guest') return null;

  const filteredItems = items.filter(
    (item) => !item.type || typeFilters[item.type]
  );
  const filterTypes = Object.keys(typeFilters);
  
  return (
    <div className={styles.panel}>
      {loading && !error && <p className={styles.loading}>Töltés...</p>}
      {filterTypes.length > 0 && (
        <div className={styles.filters}>
          {filterTypes.map((t) => (
            <label key={t} className={styles.filterLabel}>
              <input
                type="checkbox"
                checked={typeFilters[t]}
                onChange={() =>
                  setTypeFilters((prev) => ({ ...prev, [t]: !prev[t] }))
                }
              />
              {t}
            </label>
          ))}
        </div>
      )}
      <div className={styles.timeline}>
        {filteredItems.map((item) => (
          <button
            key={item.id}
            className={`${styles.item} ${item.pivot ? styles.pivot : ''}`}
            onClick={() => reconnect(item.label)}
            aria-label={item.label}
          >
            <MemoryIcon type={item.type} />
            <span className={styles.tooltip}>{item.label}</span>
          </button>
        ))}
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}