import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useState } from 'react';

export interface MemorySummary {
  id: string;
  label: string;
  type?: string;
  pivot?: boolean;
  preview?: string;
}

export type MemoryMap = { [profileName: string]: MemorySummary[] };

const MemoryContext = createContext<{
  memoryMap: MemoryMap;
  setMemoryMap: Dispatch<SetStateAction<MemoryMap>>;
} | null>(null);

export function MemoryProvider({ children }: { children: ReactNode }) {
  const [memoryMap, setMemoryMap] = useState<MemoryMap>(() => {
    if (typeof window === 'undefined') return {};
    const raw = sessionStorage.getItem('reflecta_memory_map');
    if (!raw) return {};
    try {
      return JSON.parse(raw) as MemoryMap;
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('reflecta_memory_map', JSON.stringify(memoryMap));
    }
  }, [memoryMap]);

  return (
    <MemoryContext.Provider value={{ memoryMap, setMemoryMap }}>
      {children}
    </MemoryContext.Provider>
  );
}

export function useMemoryContext() {
  const ctx = useContext(MemoryContext);
  if (!ctx) throw new Error('useMemoryContext must be used within MemoryProvider');
  return ctx;
}
