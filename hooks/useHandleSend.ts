// hooks/useHandleSend.ts
import { useCallback } from 'react';

interface Entry {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

interface UseHandleSendProps {
  sessionId: string | null;
  closingTrigger: string;
  setMessage: (value: string) => void;
  setEntries: (fn: (prev: Entry[]) => Entry[]) => void;
  setLoading: (v: boolean) => void;
  setSessionIsFresh: (v: boolean) => void;
  setIsClosing: (v: boolean) => void;
}

export function useHandleSend({
  sessionId,
  closingTrigger,
  setMessage,
  setEntries,
  setLoading,
  setSessionIsFresh,
  setIsClosing,
}: UseHandleSendProps) {
  return useCallback(async (text?: string) => {
    const message = text?.trim();
    if (!message || !sessionId) return;
    const isTrigger = message === closingTrigger.trim();

    setLoading(true);
    setSessionIsFresh(false);

    if (isTrigger) {
      setIsClosing(true);
      try {
        const res = await fetch('/api/session/close', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();
        if (res.ok) {
          const now = new Date().toISOString();
          setEntries(prev => [
            ...prev,
            { id: `${Date.now()}-user-closing`, role: 'user', content: message, created_at: now },
            { id: `${Date.now()}-closure-reply`, role: 'assistant', content: data.closureEntry, created_at: now },
            { id: `${Date.now()}-closure-label`, role: 'system', content: `Szakasz lezárása: ${data.label}`, created_at: now },
          ]);
        } else {
          console.error('[Zárás] Hiba:', data.error);
        }
      } catch (err) {
        console.error('[Zárás] Kivétel:', err);
      }
      setIsClosing(false);
      setMessage('');
      setLoading(false);
      return;
    }

    const userEntry: Entry = {
      id: `${Date.now()}`,
      role: 'user',
      content: message,
      created_at: new Date().toISOString(),
    };

    setEntries(prev => [...prev, userEntry]);
    setMessage('');

    const textarea = document.querySelector('.reflecta-input textarea') as HTMLTextAreaElement | null;
    if (textarea) textarea.style.height = 'auto';

    await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, entry: userEntry }),
    });

    const thinkingId = `${Date.now()}-thinking`;
    setEntries(prev => [...prev, {
      id: thinkingId,
      role: 'assistant',
      content: '__thinking__',
      created_at: new Date().toISOString(),
    }]);

    const res = await fetch('/api/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });

    const { content } = await res.json();
    setEntries(prev => prev.map(e => (e.id === thinkingId ? { ...e, content } : e)));
    setLoading(false);
  }, [sessionId, closingTrigger, setMessage, setEntries, setLoading, setSessionIsFresh, setIsClosing]);
}
