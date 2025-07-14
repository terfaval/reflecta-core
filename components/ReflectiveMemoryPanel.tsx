import React, { useEffect, useState } from 'react';
import styles from './ReflectiveMemoryPanel.module.css';
import MemoryIcon from './MemoryIcon';
import ReflectaGuideButton from './ReflectaGuideButton';
import AdminReviewButton from './AdminReviewButton';

import { apiFetch } from 'lib/api';
import { useUserContext } from '@/contexts/UserContext';

interface MemoryLabel {
  id: string;
  label: string;
  type?: string;
  pivot?: boolean;
}

interface Entry {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

interface ReflectiveMemoryPanelProps {
  sessionId: string | null;
  handleSend: (text?: string) => void;
  userColor?: string;
}

export default function ReflectiveMemoryPanel({ sessionId, handleSend, userColor = 'var(--user-color)' }: ReflectiveMemoryPanelProps) {
  const [items, setItems] = useState<(MemoryLabel & { preview?: string })[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilters, setTypeFilters] = useState<Record<string, boolean>>({});
  const { userRole } = useUserContext();

  const USER_TYPES = new Set(['theme', 'pivot', 'section_start']);
  const AI_TYPES = new Set(['emotion', 'strategy', 'tone']);

  const getItemStyle = (type?: string, pivot?: boolean) => {
    const useUser = pivot || USER_TYPES.has(type || '');
    const bg = useUser
      ? 'var(--user-color)'
      : AI_TYPES.has(type || '')
      ? 'var(--ai-color)'
      : 'var(--user-color)';
    return {
      backgroundColor: bg,
      color: '#fff',
      '--tooltip-bg': 'var(--ai-color)',
    } as React.CSSProperties;
  };
  
  useEffect(() => {
    if (!sessionId || userRole === 'guest') return;
    const load = async () => {
      setLoading(true);
      try {
        const [summaryData, entriesData] = await Promise.all([
          apiFetch<{ labels?: MemoryLabel[] }>(
            `/api/memory/summary?sessionId=${sessionId}`
          ),
          apiFetch<{ entries?: Entry[] }>(
            `/api/entries?sessionId=${encodeURIComponent(sessionId)}`
          ),
        ]);

        const labels = Array.isArray(summaryData?.labels)
          ? summaryData.labels
          : [];
        const entries = Array.isArray(entriesData?.entries)
          ? entriesData.entries
          : [];

        // Filter labels so that each entry appears at most once based on
        // priority while ignoring strategy labels.
        const priority = (lbl: MemoryLabel): number => {
          if (lbl.type === 'section_start') return 0;
          if (lbl.type === 'pivot' || lbl.pivot) return 1;
          if (lbl.type === 'theme' || lbl.type === 'topic') return 2;
          if (lbl.type === 'emotion') return 3;
          if (lbl.type === 'tone') return 4;
          return 5;
        };

        const filteredMap = new Map<string, MemoryLabel>();
        labels.forEach((lbl) => {
          if (lbl.type === 'strategy') return;
          const existing = filteredMap.get(lbl.id);
          if (!existing || priority(lbl) < priority(existing)) {
            filteredMap.set(lbl.id, lbl);
          }
        });

        const newItems = Array.from(filteredMap.values()).map((lbl) => {
          const entry = entries.find((e) => e.id === lbl.id);
          let preview = entry?.content ? entry.content.replace(/\s+/g, ' ').trim() : '';
          if (preview.length > 80) preview = `${preview.slice(0, 77)}...`;
          return { ...lbl, preview };
        });

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

  const scrollToEntry = (id: string) => {
    if (!id) return;
    document
      .getElementById(`entry-${id}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (userRole === 'guest') return null;

  const filteredItems = items.filter(
    (item) => !item.type || typeFilters[item.type]
  );
  const filterTypes = Object.keys(typeFilters);
  
  return (
    <div className={styles.panel}>
      <div className={styles.topButtons}>
        <ReflectaGuideButton
          userColor={userColor}
          style={{ position: 'static', bottom: 'auto', right: 'auto', fill: 'currentColor', color: 'currentColor' }}
        />
        {userRole === 'admin' && (
          <AdminReviewButton
            userColor={userColor}
            style={{ position: 'static', bottom: 'auto', right: 'auto', stroke: 'currentColor', color: 'currentColor' }}
          />
        )}
      </div>
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
            className={styles.item}
            style={getItemStyle(item.type, item.pivot)}
            onClick={() => scrollToEntry(item.id)}
            aria-label={item.preview || item.label}
          >
            <MemoryIcon type={item.type} label={item.label} />
            <span className={styles.tooltip}>{item.preview || item.label}</span>
          </button>
        ))}
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}