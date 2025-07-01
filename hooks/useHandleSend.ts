// hooks/useHandleSend.ts
import { useCallback, useEffect } from 'react';
import { useToast } from './useToast';

import { apiFetch } from 'lib/api';

interface Entry {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

interface UseHandleSendProps {
  sessionId: string | null;
  userId: string | null;
  profile: string | undefined;
  closingTrigger: string;
  setMessage: (value: string) => void;
  setEntries: (fn: (prev: Entry[]) => Entry[]) => void;
  setLoading: (v: boolean) => void;
  setSessionIsFresh: (v: boolean) => void;
  setIsClosing: (v: boolean) => void;
  setSessionId: (id: string | null) => void;
}

export function useHandleSend({
  sessionId,
  userId,
  profile,
  closingTrigger,
  setMessage,
  setEntries,
  setLoading,
  setSessionIsFresh,
  setIsClosing,
  setSessionId,
}: UseHandleSendProps) {
  const toast = useToast();
  const handleSend = useCallback(async (text?: string) => {
    const message = typeof text === 'string' ? text.trim() : '';
    if (!message) {
      // eslint-disable-next-line no-console
      console.warn('Hiányzó üzenet – a küldés nem történt meg.');
      return;
    }
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      if (!userId || !profile) {
        // eslint-disable-next-line no-console
        console.warn('Hiányzó sessionId és user adat – a küldés nem történt meg.');
        return;
      }
      setLoading(true);
      try {
        const data = await apiFetch<{ session?: { id: string } }>('/api/session', {
          method: 'POST',
          body: JSON.stringify({ userId, profile }),
        });
        if (!data?.session?.id) {
          toast('Nem sikerült létrehozni a munkamenetet.');
          setLoading(false);
          return;
        }
        currentSessionId = data.session.id;
        setSessionId(currentSessionId);
      } catch (err) {
        console.error('[session create]', err);
        toast('Nem sikerült létrehozni a munkamenetet.');
        setLoading(false);
        return;
      }
    }
    const isTrigger = message === closingTrigger.trim();

    setLoading(true);
    setSessionIsFresh(false);

    if (isTrigger) {
      setIsClosing(true);
      try {
        const data = await apiFetch<{ closureEntry?: string; label?: string }>(
          '/api/session/close',
          {
            method: 'POST',
            body: JSON.stringify({ sessionId: currentSessionId }),
          }
        );
        if (data?.closureEntry && data?.label) {
          const now = new Date().toISOString();
          setEntries(prev => [
            ...prev,
            { id: `${Date.now()}-user-closing`, role: 'user', content: message, created_at: now },
            { id: `${Date.now()}-closure-reply`, role: 'assistant', content: data.closureEntry, created_at: now },
            { id: `${Date.now()}-closure-label`, role: 'system', content: `Szakasz lezárása: ${data.label}`, created_at: now },
          ]);
        } else {
          console.error('[Zárás] Hiba:');
          toast('A lezárás nem sikerült. Kérlek próbáld újra később.');
          setIsClosing(false);
          setMessage('');
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('[Zárás] Kivétel:', err);
        toast('A lezárás nem sikerült. Kérlek próbáld újra később.');
        setIsClosing(false);
        setMessage('');
        setLoading(false);
        // keep currentSessionId so session can be resumed later
        return;
      }
      setIsClosing(false);
      setMessage('');
      setLoading(false);
      // do not clear the session id after closing; it remains available
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

    try {
      await apiFetch('/api/entries', {
        method: 'POST',
        body: JSON.stringify({ sessionId: currentSessionId, entry: userEntry }),
      });
    } catch (err) {
      console.error('[entries]', err);
      toast('Az üzenet mentése nem sikerült.');
      setEntries(prev => prev.filter(e => e.id !== userEntry.id));
      setLoading(false);
      return;
    }

    const thinkingId = `${Date.now()}-thinking`;
    setEntries(prev => [...prev, {
      id: thinkingId,
      role: 'assistant',
      content: '__thinking__',
      created_at: new Date().toISOString(),
    }]);

    try {
      const resp = await apiFetch<{ content?: string }>('/api/respond', {
        method: 'POST',
        body: JSON.stringify({ sessionId: currentSessionId, content: userEntry.content }),
      });

      const reply = resp?.content ?? '';

      setEntries(prev =>
        prev.map(e => (e.id === thinkingId ? { ...e, content: reply } : e)),
      );
    } catch (err) {
      console.error('[respond]', err);
      setEntries(prev =>
        prev.map(e =>
          e.id === thinkingId ? { ...e, content: 'Hiba történt' } : e,
        ),
      );
      toast('Nem sikerült válaszolni. Kérlek próbáld újra.');
      setLoading(false);
      return;
    }
    setLoading(false);
  }, [sessionId, userId, profile, closingTrigger, setMessage, setEntries, setLoading, setSessionIsFresh, setIsClosing, setSessionId, toast]);

  useEffect(() => {
    const textarea = document.querySelector('.reflecta-input textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend(textarea.value);
      }
    };

    textarea.addEventListener('keydown', onKeyDown);
    return () => textarea.removeEventListener('keydown', onKeyDown);
  }, [handleSend]);

  return handleSend;
}