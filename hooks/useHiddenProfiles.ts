import { useEffect, useState } from 'react';

const STORAGE_KEY = 'reflecta_hidden_profiles';

export function useHiddenProfiles() {
  const [hidden, setHidden] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw) as string[];
        if (Array.isArray(arr)) setHidden(arr);
      }
    } catch {
      // ignore
    }
  }, []);

  const hideProfile = (id: string) => {
    setHidden((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const showAll = () => {
    setHidden([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return { hidden, hideProfile, showAll };
}