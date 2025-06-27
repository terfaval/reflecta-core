import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

import { apiFetch } from 'lib/api';

type UseUserSessionParams = {
  profile: string | string[] | undefined;
  onReady: (data: {
    userId: string;
    sessionId: string;
    startingPrompt: string;
    closingTrigger: string;
  }) => void;
  enabled?: boolean;
  userId?: string | null;
};

export function useUserSession({ profile, onReady, enabled = true, userId }: UseUserSessionParams) {
  const router = useRouter();
  const initialized = useRef(false);
  const { session: sessionOverride } = router.query;

  useEffect(() => {
    if (!enabled || !router.isReady) return;
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
        alert('Nem sikerült betölteni a profilt.');
        return;
      }

      const closingTrigger = profileData?.closing_trigger || '';

      let promptResp;
      try {
        promptResp = await apiFetch<{ prompt: string }>('/api/starting-prompt', {
          method: 'POST',
          body: JSON.stringify({ userId: uid, profile }),
        });
      } catch (err) {
        alert('Nem sikerült lekérni az indító üzenetet.');
        return;
      }

      const promptText = promptResp?.prompt || '';

      if (typeof sessionOverride === 'string') {
        initialized.current = true;
        onReady({
          userId: uid,
          sessionId: sessionOverride,
          startingPrompt: promptText,
          closingTrigger,
        });
        return;
      }

      let sessionData;
      try {
        sessionData = await apiFetch<{ session?: { id: string } }>('/api/session', {
          method: 'POST',
          body: JSON.stringify({ userId: uid, profile }),
        });
      } catch (err) {
        alert('Nem sikerült létrehozni a munkamenetet.');
        return;
      }

      if (!sessionData?.session?.id) {
        alert('Nem sikerült létrehozni a munkamenetet.');
        return;
      }
      initialized.current = true;

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
  }, [profile, onReady, enabled, userId, router.isReady, sessionOverride]);
}
