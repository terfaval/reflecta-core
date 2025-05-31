import { useEffect } from 'react';
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

  useEffect(() => {
    const handleWPUser = (event: MessageEvent) => {
      if (event.data?.type === 'wp_user') {
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
            const profileRes = await fetch('/api/profile', {
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

            // 🌀 Session indítása csak ezután
            const sessionRes = await fetch('/api/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user_id, profile }),
            });

            const sessionData = await sessionRes.json();
            if (!sessionData?.session?.id) return;

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
