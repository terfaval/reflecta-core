import React, { useEffect, useState } from 'react';
import BackToLogsButton from '@/components/BackToLogsButton';
import { apiFetch } from '@/lib/api';
import styles from '../AdminStrategyReview.module.css';

interface Suggestion {
  id: number;
  strategy: string;
  profile: string | null;
  content: string;
  confidence?: number | null;
  source_entry_id?: string | null;
  created_at: string;
}

export default function StrategyReviewPage() {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ suggestions: Suggestion[] }>('/api/admin/strategy-suggestions');
      const list = data.suggestions || [];
      list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setItems(list);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Hiba történt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handle = async (id: number, action: 'accept' | 'reject') => {
    try {
      await apiFetch(`/api/admin/strategy-suggestions/${id}/${action}`, { method: 'POST' });
      setItems((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Hiba');
    }
  };

  const groups: Record<string, Suggestion[]> = {};
  for (const item of items) {
    if (!groups[item.strategy]) groups[item.strategy] = [];
    groups[item.strategy].push(item);
  }

  return (
    <div className={styles.container}>
      <BackToLogsButton />
      <h1>Exemplar javaslatok ({items.length})</h1>
      {loading && <p>Betöltés...</p>}
      {error && <p className={styles.error}>{error}</p>}
      {Object.entries(groups).map(([strategy, list]) => (
        <div key={strategy} className={styles.group}>
          <h2>{strategy}</h2>
          {list.map((item) => (
            <div key={item.id} className={styles.item}>
              <p>{item.content}</p>
              <div className={styles.meta}>
                {item.profile || 'general'}
                {item.confidence != null && ` | bizalom: ${item.confidence}`}
                {item.source_entry_id && ` | ${item.source_entry_id}`}
              </div>
              <div className={styles.buttons}>
                <button className={styles.accept} onClick={() => handle(item.id, 'accept')}>Elfogadás</button>
                <button className={styles.reject} onClick={() => handle(item.id, 'reject')}>Elutasítás</button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}