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

  const WP_ORIGIN = process.env.NEXT_PUBLIC_WP_ORIGIN || 'https://beenook.hu/reflecta';

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
      return;
    }

    const handleWPUser = (event: MessageEvent) => {
      if (event.origin !== WP_ORIGIN) return;
      if (event.data?.type === 'init_user' || event.data?.type === 'wp_user') {
        if (initialized.current) return;
        const { wp_user_id, email } = event.data;
        if (!wp_user_id || !email || typeof profile !== 'string') return;

        fetch('/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wp_user_id, email }),
        })
          .then(res => res.json())
          .then(async ({ user_id }) => {
            window.parent.postMessage({ status: 'user_received' }, event.origin);
            startSession(user_id);
          })
          .catch(console.error);
      }
    };

    window.addEventListener('message', handleWPUser);
    return () => window.removeEventListener('message', handleWPUser);
  }, [profile, onReady, enabled, userId]);
}
