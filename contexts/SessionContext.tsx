import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface SessionMeta {
  id: string;
  started_at: string;
  ended_at: string | null;
}

export interface ConversationMeta {
  conversation_id: string;
  profile: string;
  title?: string | null;
  started_at?: string;
  sessions: SessionMeta[];
}

export type SessionMap = Record<string, ConversationMeta[]>;

interface SessionContextType {
  sessionMap: SessionMap;
  setSessionMap: (map: SessionMap) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionMap, setSessionMap] = useState<SessionMap>({});

  useEffect(() => {
    const raw = sessionStorage.getItem('reflecta_session_map');
    if (raw) {
      try {
        setSessionMap(JSON.parse(raw));
      } catch {
        setSessionMap({});
      }
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem('reflecta_session_map', JSON.stringify(sessionMap));
  }, [sessionMap]);

  return (
    <SessionContext.Provider value={{ sessionMap, setSessionMap }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext(): SessionContextType {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSessionContext must be used within SessionProvider');
  return ctx;
}