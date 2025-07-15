import { createContext, useContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';

export interface LastEntry {
  content: string;
  created_at: string;
}

export type LastEntryMap = Record<string, LastEntry | null>;

interface LastEntryContextType {
  lastEntryMap: LastEntryMap;
  setLastEntryMap: Dispatch<SetStateAction<LastEntryMap>>;
}

const LastEntryContext = createContext<LastEntryContextType | undefined>(undefined);

export function LastEntryProvider({ children }: { children: ReactNode }) {
  const [lastEntryMap, setLastEntryMap] = useState<LastEntryMap>(() => {
    if (typeof window === 'undefined') return {};
    const raw = sessionStorage.getItem('reflecta_last_entry_map');
    if (!raw) return {};
    try {
      return JSON.parse(raw) as LastEntryMap;
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('reflecta_last_entry_map', JSON.stringify(lastEntryMap));
    }
  }, [lastEntryMap]);

  return (
    <LastEntryContext.Provider value={{ lastEntryMap, setLastEntryMap }}>
      {children}
    </LastEntryContext.Provider>
  );
}

export function useLastEntryContext(): LastEntryContextType {
  const ctx = useContext(LastEntryContext);
  if (!ctx) throw new Error('useLastEntryContext must be used within LastEntryProvider');
  return ctx;
}