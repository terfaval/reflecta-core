import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

type UseUserSessionParams = {
  profile: string | string[] | undefined;
  onReady: (data: {
    userId: string;
    sessionId: string;
    startingPrompts: { label: string; message: string }[];
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
    if (!enabled) return;

    const startSession = async (uid: string) => {
      const profileRes = await fetch('/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile, userId: uid }),
      });

      if (profileRes.status === 403) {
        router.push('/not-authorized');
        return;
      }

      const profileData = await profileRes.json();
      const prompts = profileData?.starting_prompts || [];
      const closingTrigger = profileData?.closing_trigger || '';

      if (typeof sessionOverride === 'string') {
        initialized.current = true;
        onReady({
          userId: uid,
          sessionId: sessionOverride,
          startingPrompts: prompts,
          closingTrigger,
        });
        return;
      }

      const sessionRes = await fetch('/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, profile }),
      });

      const sessionData = await sessionRes.json();
      if (!sessionData?.session?.id) return;
      initialized.current = true;

      onReady({
        userId: uid,
        sessionId: sessionData.session.id,
        startingPrompts: prompts,
        closingTrigger,
      });
    };

    if (userId && typeof profile === 'string' && !initialized.current) {
      startSession(userId);
    }

    // waiting for external user initialization is now handled outside
  }, [profile, onReady, enabled, userId]);
}
