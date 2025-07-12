// hooks/useHandleSend.ts
import { useCallback, useEffect, useRef } from 'react';
import { useErrorToast } from './useErrorToast';

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
  userRole: string | null;
  entries: Entry[];
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
  userRole,
  entries,
}: UseHandleSendProps) {
  const errorToast = useErrorToast();
  const sessionPromise = useRef<Promise<string> | null>(null);
  const storedUserId =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('reflecta_user_id')
      : null;
  const uid = userId || storedUserId;
  const handleSend = useCallback(async (text?: string) => {
    const message = typeof text === 'string' ? text.trim() : '';
    if (!message) {
      // eslint-disable-next-line no-console
      console.warn('Hiányzó üzenet – a küldés nem történt meg.');
      return;
    }

    if (userRole === 'guest') {
      if (!sessionId) {
        console.warn('[guest send] missing sessionId');
        return;
      }
      setLoading(true);
      setSessionIsFresh(false);

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

      const history = [
        ...entries.map(e => ({ role: e.role, content: e.content })),
        { role: 'user', content: message },
      ];

      const thinkingId = `${Date.now()}-thinking`;
      setEntries(prev => [
        ...prev,
        { id: thinkingId, role: 'assistant', content: '__thinking__', created_at: new Date().toISOString() },
      ]);

      try {
        const resp = await apiFetch<{ content?: string }>('/api/guest/respond', {
          method: 'POST',
          body: JSON.stringify({ guestId: sessionId, profile: profile || 'Reflecta', history, message }),
        });

        const reply = resp?.content ?? '';
        setEntries(prev => prev.map(e => (e.id === thinkingId ? { ...e, content: reply } : e)));
      } catch (err) {
        console.error('[guest/respond]', err);
        setEntries(prev => prev.map(e => (e.id === thinkingId ? { ...e, content: 'Hiba történt' } : e)));
        errorToast('Nem sikerült válaszolni. Kérlek próbáld újra.');
      }
      setLoading(false);
      return;
    }
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      if (!userId || !profile) {
        // eslint-disable-next-line no-console
        console.warn('Hiányzó sessionId és user adat – a küldés nem történt meg.');
        return;
      }
      if (!sessionPromise.current) {
        setLoading(true);
        sessionPromise.current = apiFetch<{ session?: { id: string } }>('/api/session', {
          method: 'POST',
          body: JSON.stringify({ userId: uid, profile }),
        })
          .then((data) => {
            if (!data?.session?.id) {
              throw new Error('create failed');
            }
            setSessionId(data.session.id);
            return data.session.id;
          })
          .finally(() => {
            sessionPromise.current = null;
          });
      }
      try {
        currentSessionId = await sessionPromise.current;
      } catch (err) {
        console.error('[session create]', err);
        errorToast('Nem sikerült létrehozni a munkamenetet.');
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
            body: JSON.stringify({ sessionId: currentSessionId, userId: uid || undefined }),
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
          errorToast('A lezárás nem sikerült. Kérlek próbáld újra később.');
          setIsClosing(false);
          setMessage('');
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('[Zárás] Kivétel:', err);
        errorToast('A lezárás nem sikerült. Kérlek próbáld újra később.');
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
        body: JSON.stringify({
          sessionId: currentSessionId,
          entry: userEntry,
          userId: uid || undefined,
        }),
      });
    } catch (err) {
      console.error('[entries]', err);
      errorToast('Az üzenet mentése nem sikerült.');
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
        body: JSON.stringify({
          sessionId: currentSessionId,
          content: userEntry.content,
          userId: uid || undefined,
        }),
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
      errorToast('Nem sikerült válaszolni. Kérlek próbáld újra.');
      setLoading(false);
      return;
    }
    setLoading(false);
  }, [sessionId, userId, profile, closingTrigger, setMessage, setEntries, setLoading, setSessionIsFresh, setIsClosing, setSessionId, userRole, entries, errorToast]);

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