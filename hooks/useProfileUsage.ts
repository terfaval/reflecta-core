import { useEffect, useState } from 'react';
import { useProfileContext } from '@/contexts/ProfileContext';
import { useUserContext } from '@/contexts/UserContext';

export interface UsageMap {
  [id: string]: number;
}

const BASE_KEY = 'reflecta_profile_usage';

export function useProfileUsage() {
  const { profile } = useProfileContext();
  const { userId, guestSessionId } = useUserContext();
  const [usage, setUsage] = useState<UsageMap>({});

  const getKey = () => `${BASE_KEY}_${userId || guestSessionId || 'unknown'}`

  useEffect(() => {
    try {
      const raw = localStorage.getItem(getKey());
      if (raw) {
        const parsed = JSON.parse(raw) as UsageMap;
        setUsage(parsed);
        } else {
        setUsage({});
      }
    } catch {
      // ignore
    }
  }, [userId, guestSessionId]);

  useEffect(() => {
    if (!profile) return;
    recordUse(profile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const recordUse = (id: string) => {
    setUsage((prev) => {
      const next = { ...prev, [id]: Date.now() };
      try {
        localStorage.setItem(getKey(), JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return { usage, recordUse };
}
