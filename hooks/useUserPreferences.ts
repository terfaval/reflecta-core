import { useEffect, useState } from 'react';
import { useUserContext } from '@/contexts/UserContext';
import type { UserPreferences } from '@/lib/types';

export function useUserPreferences() {
  const { userId } = useUserContext();
  const [prefs, setPrefs] = useState<UserPreferences>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`/api/preferences/get?user_id=${userId}`)
      .then(res => res.json())
      .then(data => setPrefs(data || {}))
      .finally(() => setLoading(false));
  }, [userId]);

  const updatePrefs = async (updates: Partial<UserPreferences>) => {
    if (!userId) return;
    const newPrefs = { ...prefs, ...updates };
    setPrefs(newPrefs);

    await fetch('/api/preferences/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, preferences: newPrefs }),
    });
  };

  return { prefs, updatePrefs, loading };
}
