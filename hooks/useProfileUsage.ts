import { useEffect, useState } from 'react';
import { useProfileContext } from '@/contexts/ProfileContext';

export interface UsageMap {
  [id: string]: number;
}

const STORAGE_KEY = 'reflecta_profile_usage';

export function useProfileUsage() {
  const { profile } = useProfileContext();
  const [usage, setUsage] = useState<UsageMap>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as UsageMap;
        setUsage(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!profile) return;
    recordUse(profile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const recordUse = (id: string) => {
    setUsage((prev) => {
      const next = { ...prev, [id]: Date.now() };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return { usage, recordUse };
}
