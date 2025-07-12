import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

import { apiFetch } from 'lib/api';
import { useErrorToast } from './useErrorToast';

interface Entry {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

type UseUserSessionParams = {
  profile: string | string[] | undefined;
  onReady: (data: {
    userId: string;
    sessionId: string;
    startingPrompt: string;
    closingTrigger: string;
    entries?: Entry[];
  }) => void;
  enabled?: boolean;
  userId?: string | null;
  userRole?: string | null;
};

export function useUserSession({ profile, onReady, enabled = true, userId, userRole }: UseUserSessionParams) {
  const router = useRouter();
  const initialized = useRef(false);
  const errorToast = useErrorToast();
  const { session: sessionOverride, existing } = router.query;
  const storedSessionId =
    typeof profile === 'string'
      ? sessionStorage.getItem(`reflecta_session_${profile}`)
      : null;

  useEffect(() => {
    if (!enabled || !router.isReady || userRole === 'guest') return;
    if (!userId || typeof profile !== 'string') return;

    const startSession = async (uid: string) => {
      let profileData;
      try {
        profileData = await apiFetch<{ closing_trigger?: string }>('/api/profile', {
          method: 'POST',
          body: JSON.stringify({ name: profile, userId: uid }),
        });
      } catch (err: any) {
        if (err.status === 403) {
          router.push('/non-authorized');
          return;
        }
        errorToast({ message: 'Nem sikerült betölteni a profilt.', type: 'network' });
        return;
      }

      const closingTrigger = profileData?.closing_trigger || '';

      // If we have a stored session and no override in the URL,
      // resume that session without creating a new one.
      if (!sessionOverride && storedSessionId) {
        initialized.current = true;
        sessionStorage.setItem(`reflecta_session_${profile}`, storedSessionId);
        let entries: Entry[] = [];
        if (existing === '1') {
          try {
            const data = await apiFetch<{ entries?: Entry[] }>(
              `/api/entries?sessionId=${encodeURIComponent(storedSessionId)}`,
            );
            entries = data.entries || [];
          } catch (err) {
            console.error('[load entries]', err);
            errorToast({ message: 'Az előzmények betöltése nem sikerült.', type: 'network' });
          }
        }
        onReady({
          userId: uid,
          sessionId: storedSessionId,
          startingPrompt: '',
          closingTrigger,
          entries,
        });
        return;
      }

      if (typeof sessionOverride === 'string') {
        initialized.current = true;
        sessionStorage.setItem(`reflecta_session_${profile}`, sessionOverride);
        let entries: Entry[] = [];
        if (existing === '1') {
          try {
            const data = await apiFetch<{ entries?: Entry[] }>(
              `/api/entries?sessionId=${encodeURIComponent(sessionOverride)}`,
            );
            entries = data.entries || [];
          } catch (err) {
            console.error('[load entries]', err);
            errorToast({ message: 'Az előzmények betöltése nem sikerült.', type: 'network' });
          }
        }
        onReady({
          userId: uid,
          sessionId: sessionOverride,
          startingPrompt: '',
          closingTrigger,
          entries,
        });
        return;
      }

      let promptResp;
      try {
        promptResp = await apiFetch<{ prompt: string }>('/api/starting-prompt', {
          method: 'POST',
          body: JSON.stringify({ userId: uid, profile }),
        });
      } catch (err) {
        errorToast({ message: 'Nem sikerült lekérni az indító üzenetet.', type: 'network' });
        return;
      }

      const promptText = promptResp?.prompt || '';

      let sessionData;
      try {
        sessionData = await apiFetch<{ session?: { id: string } }>('/api/session', {
          method: 'POST',
          body: JSON.stringify({ userId: uid, profile }),
        });
      } catch (err) {
        errorToast({ message: 'Nem sikerült létrehozni a munkamenetet.', type: 'network' });
        return;
      }

      if (!sessionData?.session?.id) {
        errorToast({ message: 'Nem sikerült létrehozni a munkamenetet.', type: 'network' });
        return;
      }
      initialized.current = true;
      sessionStorage.setItem(`reflecta_session_${profile}`, sessionData.session.id);

      onReady({
        userId: uid,
        sessionId: sessionData.session.id,
        startingPrompt: promptText,
        closingTrigger,
      });
    };

    if (userId && typeof profile === 'string' && !initialized.current) {
      startSession(userId);
    }

    // waiting for external user initialization is now handled outside
  }, [
    profile,
    onReady,
    enabled,
    userId,
    router.isReady,
    sessionOverride,
    storedSessionId,
    userRole,
  ]);
}
