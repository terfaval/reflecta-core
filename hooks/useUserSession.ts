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
};

export function useUserSession({ profile, onReady }: UseUserSessionParams) {
  const router = useRouter();
  const initialized = useRef(false);
  const { session: sessionOverride } = router.query;

  useEffect(() => {
    const handleWPUser = (event: MessageEvent) => {
      if (event.data?.type === 'wp_user') {
       if (initialized.current) return;
        const { wp_user_id, email } = event.data;
        if (!wp_user_id || !email || typeof profile !== 'string') return;

        fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wp_user_id, email }),
        })
          .then(res => res.json())
          .then(async ({ user_id }) => {
            // 🔐 Hozzáférés ellenőrzése
            const profileRes = await fetch('/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: profile, userId: user_id }),
            });

            if (profileRes.status === 403) {
              router.push('/not-authorized'); // vagy mutass hibát
              return;
            }

            const profileData = await profileRes.json();
            const prompts = profileData?.starting_prompts || [];
            const closingTrigger = profileData?.closing_trigger || '';

            if (typeof sessionOverride === 'string') {
              initialized.current = true;
              onReady({
                userId: user_id,
                sessionId: sessionOverride,
                startingPrompts: prompts,
                closingTrigger,
              });
              return;
            }

            // 🌀 Session indítása csak ezután
            const sessionRes = await fetch('/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user_id, profile }),
            });

            const sessionData = await sessionRes.json();
            if (!sessionData?.session?.id) return;
            initialized.current = true;

            onReady({
              userId: user_id,
              sessionId: sessionData.session.id,
              startingPrompts: prompts,
              closingTrigger,
            });
          })
          .catch(console.error);
      }
    };

    window.addEventListener('message', handleWPUser);
    return () => window.removeEventListener('message', handleWPUser);
  }, [profile, onReady]);
}
