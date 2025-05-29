// hooks/useUserSession.ts
import { useEffect } from 'react';

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
            const sessionRes = await fetch('/api/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user_id, profile }),
            });
            const sessionData = await sessionRes.json();
            if (!sessionData?.session?.id) return;

            const profileRes = await fetch(`/api/profile?name=${profile}`);
            const profileData = await profileRes.json();
            const prompts = profileData?.starting_prompts || [];
            const closingTrigger = profileData?.closing_trigger || '';

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
